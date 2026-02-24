const mongoose = require('mongoose');

const API_KEY = 'expertbridge-sync-mongo-x9k2m5';

// Normalize a string for matching: lowercase, strip punctuation, collapse whitespace
function normalize(s) {
  return (s || '').toLowerCase().replace(/[.\-_\/\\()&,]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Extract tokens (words >= 2 chars) from a string
function tokens(s) {
  return normalize(s).split(' ').filter(w => w.length >= 2);
}

// Extract abbreviation from parentheses: "Healthcare & Life Sciences (HLS)" -> "hls"
function extractAbbrev(s) {
  var m = (s || '').match(/\(([^)]+)\)/);
  return m ? m[1].toLowerCase().trim() : null;
}

// Remove parenthetical from original name: "Information Technology (IT)" -> "Information Technology"
function removeParens(s) {
  return (s || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

// Convert slug alias to words: "healthcare---life-sciences--hls-" -> ["healthcare", "life", "sciences", "hls"]
function slugToTokens(slug) {
  return (slug || '').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length >= 2);
}

// Escape regex special chars
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Word-boundary substring match: "technology" matches "information technology" but NOT "biotechnology"
function wordBoundaryContains(needle, haystack) {
  if (!needle || !haystack) return false;
  try {
    return new RegExp('\\b' + escapeRegex(needle) + '\\b').test(haystack);
  } catch (e) {
    return haystack.includes(needle);
  }
}

// Check if two tokens match (exact or prefix for longer tokens)
function tokenMatch(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.startsWith(a)) return true;
  if (b.length >= 4 && a.startsWith(b)) return true;
  return false;
}

async function matchSkills(skillStrings) {
  if (!skillStrings || !Array.isArray(skillStrings) || skillStrings.length === 0) return [];

  const allSkills = await DB.Skill.find({}).lean();
  const matchedIds = new Set();
  const debugLog = [];

  for (const skillStr of skillStrings) {
    const raw = (skillStr || '').trim();
    if (!raw) continue;
    const norm = normalize(raw);
    const inputToks = tokens(raw);
    let matched = false;

    for (const skill of allSkills) {
      const skillNorm = normalize(skill.name);
      if (!skillNorm) continue;
      const skillToks = tokens(skill.name);
      const aliasNorm = normalize(skill.alias || '');
      const aliasToks = slugToTokens(skill.alias || '');

      // 1. Exact normalized match
      if (norm === skillNorm || norm === aliasNorm) {
        matchedIds.add(skill._id.toString());
        matched = true;
        continue;
      }

      // 2. Substring containment (for skills, keep plain includes since "react" should match "reactjs")
      if (norm.includes(skillNorm) || skillNorm.includes(norm)) {
        matchedIds.add(skill._id.toString());
        matched = true;
        continue;
      }

      // 3. Alias substring (string alias) - also try plain includes for single-word skills like "react" in "reactjs"
      if (aliasNorm && (wordBoundaryContains(aliasNorm, norm) || wordBoundaryContains(norm, aliasNorm)
          || aliasNorm.includes(norm) || norm.includes(aliasNorm))) {
        matchedIds.add(skill._id.toString());
        matched = true;
        continue;
      }

      // 4. Token overlap: any significant token match
      var hasMatch = inputToks.some(function(t) {
        return skillToks.some(function(st) { return tokenMatch(t, st); })
            || aliasToks.some(function(at) { return tokenMatch(t, at); });
      });
      if (hasMatch) {
        matchedIds.add(skill._id.toString());
        matched = true;
        continue;
      }
    }

    debugLog.push({ input: raw, matched: matched });
  }

  // Resolve matched skill names for logging
  var matchedNames = Array.from(matchedIds).map(function(id) {
    var s = allSkills.find(function(sk) { return sk._id.toString() === id; });
    return s ? s.name : id;
  });
  console.log('[SYNC] Skill matching:', JSON.stringify(debugLog));
  console.log('[SYNC] Matched skills:', JSON.stringify(matchedNames));
  return Array.from(matchedIds).map(function(id) { return new mongoose.Types.ObjectId(id); });
}

async function matchIndustries(industryStrings) {
  if (!industryStrings || !Array.isArray(industryStrings) || industryStrings.length === 0) return [];

  const allIndustries = await DB.Industry.find({}).lean();
  const matchedIds = new Set();
  const debugLog = [];

  for (const indStr of industryStrings) {
    const raw = (indStr || '').trim();
    if (!raw) continue;
    const norm = normalize(raw);
    const inputToks = tokens(raw);
    const inputAbbrev = extractAbbrev(raw);
    let matched = false;

    for (const industry of allIndustries) {
      const indNorm = normalize(industry.name);
      if (!indNorm) continue;
      const indToks = tokens(industry.name);
      const indAbbrev = extractAbbrev(industry.name);
      const aliasToks = slugToTokens(industry.alias || '');

      // 1. Exact normalized match
      if (norm === indNorm) {
        matchedIds.add(industry._id.toString());
        matched = true;
        continue;
      }

      // 2. Word-boundary substring containment (prevents "technology" matching "biotechnology")
      if (wordBoundaryContains(norm, indNorm) || wordBoundaryContains(indNorm, norm)) {
        matchedIds.add(industry._id.toString());
        matched = true;
        continue;
      }

      // 3. Abbreviation matching
      // 3a. Both have parens abbreviations that match
      if (inputAbbrev && indAbbrev && inputAbbrev === indAbbrev) {
        matchedIds.add(industry._id.toString());
        matched = true;
        continue;
      }
      // 3b. Short input like "IT" or "BPO" matches DB abbreviation in parens
      if (norm.length <= 5 && indAbbrev && norm === indAbbrev) {
        matchedIds.add(industry._id.toString());
        matched = true;
        continue;
      }
      // 3c. Any input TOKEN matches DB abbreviation (e.g., "IT" in "IT Services" matches "(IT)")
      if (indAbbrev) {
        var hasAbbrevMatch = inputToks.some(function(t) { return t === indAbbrev; });
        if (hasAbbrevMatch) {
          matchedIds.add(industry._id.toString());
          matched = true;
          continue;
        }
      }
      // 3d. Input contains the name without abbreviation (use original name, not normalized)
      if (indAbbrev) {
        var cleanName = normalize(removeParens(industry.name));
        if (cleanName && cleanName.length >= 3 && (wordBoundaryContains(norm, cleanName) || wordBoundaryContains(cleanName, norm))) {
          matchedIds.add(industry._id.toString());
          matched = true;
          continue;
        }
      }

      // 4. Token overlap - require input coverage >50% AND effective char coverage >=40% of DB name
      var sigTokens = indToks.filter(function(t) { return t.length >= 3; });
      var inputSigToks = inputToks.filter(function(t) { return t.length >= 3; });
      var matchedInputToks = inputSigToks.filter(function(t) {
        return sigTokens.some(function(st) { return tokenMatch(t, st); });
      });
      var matchCount = matchedInputToks.length;
      var inputCoverage = inputSigToks.length > 0 ? matchCount / inputSigToks.length : 0;
      // Effective char coverage: for prefix matches, count the DB token length (not input token)
      var effectiveChars = matchedInputToks.reduce(function(sum, t) {
        var bestDbMatch = sigTokens.find(function(st) { return tokenMatch(t, st); });
        return sum + (bestDbMatch ? Math.max(t.length, bestDbMatch.length) : t.length);
      }, 0);
      var charCoverage = indNorm.length > 0 ? effectiveChars / indNorm.length : 0;
      if (matchCount > 0 && inputCoverage > 0.5 && charCoverage >= 0.4) {
        matchedIds.add(industry._id.toString());
        matched = true;
        continue;
      }

      // 5. Alias token overlap (same effective character coverage requirement)
      var aliasSigToks = aliasToks.filter(function(t) { return t.length >= 3; });
      var matchedAliasToks = inputSigToks.filter(function(t) {
        return aliasSigToks.some(function(at) { return tokenMatch(t, at); });
      });
      var aliasMatchCount = matchedAliasToks.length;
      var aliasInputCov = inputSigToks.length > 0 ? aliasMatchCount / inputSigToks.length : 0;
      var aliasNormStr = aliasToks.join(' ');
      var aliasEffChars = matchedAliasToks.reduce(function(sum, t) {
        var bestMatch = aliasSigToks.find(function(at) { return tokenMatch(t, at); });
        return sum + (bestMatch ? Math.max(t.length, bestMatch.length) : t.length);
      }, 0);
      var aliasCharCov = aliasNormStr.length > 0 ? aliasEffChars / aliasNormStr.length : 0;
      if (aliasMatchCount > 0 && aliasInputCov > 0.5 && aliasCharCov >= 0.4) {
        matchedIds.add(industry._id.toString());
        matched = true;
      }
    }

    debugLog.push({ input: raw, matched: matched });
  }

  // Resolve matched industry names for logging
  var matchedNames = Array.from(matchedIds).map(function(id) {
    var ind = allIndustries.find(function(i) { return i._id.toString() === id; });
    return ind ? ind.name.trim() : id;
  });
  console.log('[SYNC] Industry matching:', JSON.stringify(debugLog));
  console.log('[SYNC] Matched industries:', JSON.stringify(matchedNames));
  return Array.from(matchedIds).map(function(id) { return new mongoose.Types.ObjectId(id); });
}

exports.syncExpertProfile = async (req, res) => {
  try {
    // API key auth
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      mongo_user_id,
      email,
      full_name,
      profile_summary,
      skills_technical,
      skills_frameworks,
      skills_domains,
      industries,
      experience_years,
      cohort_tags,
      category
    } = req.body;

    if (!mongo_user_id && !email) {
      return res.status(400).json({ success: false, error: 'mongo_user_id or email required' });
    }

    // Find user
    let user = null;
    if (mongo_user_id) {
      try {
        user = await DB.User.findById(mongo_user_id);
      } catch (e) {
        console.log('[SYNC] Invalid mongo_user_id:', mongo_user_id);
      }
    }
    if (!user && email) {
      user = await DB.User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('[SYNC] Syncing profile for:', user.email, '(', user._id, ')');

    // Build update object
    const update = {};
    const syncLog = { matched_skills: 0, matched_industries: 0, fields_updated: [] };

    // === FORMAT BIO AS STRUCTURED HTML ===
    if (profile_summary) {
      let formattedBio = '';
      const roleBullets = profile_summary.role_bullets || profile_summary.role_timeline || [];
      const expertiseBullets = profile_summary.expertise_bullets || [];

      if (roleBullets.length > 0 || expertiseBullets.length > 0) {
        // New structured HTML format
        if (roleBullets.length > 0) {
          const roleLines = roleBullets.slice(0, 4).map(function(role) { return '<strong>' + role + '</strong>'; }).join('<br>\n');
          formattedBio += roleLines + '<br>\n';
        }
        if (expertiseBullets.length > 0) {
          const expertiseLines = expertiseBullets.slice(0, 5).map(function(bullet) { return '\u2022 ' + bullet; }).join('<br>\n');
          formattedBio += expertiseLines;
        }
        update.bio = formattedBio;
        syncLog.fields_updated.push('bio');
        console.log('[SYNC] Bio formatted as structured HTML with', roleBullets.length, 'roles and', expertiseBullets.length, 'expertise bullets');
      } else if (profile_summary.narrative) {
        // Fallback to narrative paragraph
        update.bio = profile_summary.narrative;
        syncLog.fields_updated.push('bio');
        console.log('[SYNC] Bio using narrative fallback');
      }

      // === MAP CITY, STATE, PHONE FROM CONTACT ===
      if (profile_summary.contact) {
        var contact = profile_summary.contact;

        // Phone
        if (contact.phone) {
          update.phoneNumber = contact.phone;
          syncLog.fields_updated.push('phoneNumber');
          console.log('[SYNC] Mapped phone:', contact.phone);
        }

        // City and State parsing
        if (contact.city) {
          var city = contact.city;
          var state = contact.state || null;

          // If city contains comma, try to split into city, state
          // e.g., "Vadodara, Gujarat" or "San Francisco, CA"
          if (city.indexOf(',') !== -1 && !state) {
            var parts = city.split(',').map(function(p) { return p.trim(); });
            city = parts[0];
            state = parts[1] || null;
          }

          update.city = city;
          syncLog.fields_updated.push('city');
          console.log('[SYNC] Mapped city:', city);

          if (state) {
            update.state = state;
            syncLog.fields_updated.push('state');
            console.log('[SYNC] Mapped state:', state);
          }
        }

        // Country - only set if not already a complex object in DB
        // (Registration stores country as {name, code, capital, ...})
        // We skip country to avoid overwriting the rich object
        if (contact.country) {
          console.log('[SYNC] Skipping country (preserved from registration):', contact.country);
        }

        // === SET COUNTRY FROM AI EXTRACTION (if user has no country yet) ===
        if (contact.country && !user.country) {
          update.country = contact.country;
          syncLog.fields_updated.push('country');
          console.log('[SYNC] Set country from AI extraction:', contact.country);
        }

        // === COUNTRY TRIANGULATION ===
        // If country is still not set, infer from phone number country code
        if (!update.country && !user.country) {
          var phone = update.phoneNumber || (contact && contact.phone) || '';
          var phoneCountryMap = {
            '+91': { country: 'India', code: 'IN' },
            '+1': { country: 'United States', code: 'US' },
            '+44': { country: 'United Kingdom', code: 'GB' },
            '+971': { country: 'United Arab Emirates', code: 'AE' },
            '+65': { country: 'Singapore', code: 'SG' },
            '+61': { country: 'Australia', code: 'AU' },
            '+49': { country: 'Germany', code: 'DE' },
            '+33': { country: 'France', code: 'FR' },
            '+81': { country: 'Japan', code: 'JP' },
            '+86': { country: 'China', code: 'CN' },
            '+966': { country: 'Saudi Arabia', code: 'SA' },
            '+974': { country: 'Qatar', code: 'QA' },
            '+973': { country: 'Bahrain', code: 'BH' },
            '+968': { country: 'Oman', code: 'OM' },
            '+965': { country: 'Kuwait', code: 'KW' }
          };

          // Check longest prefixes first (3-digit codes before 2-digit)
          var sortedPrefixes = Object.keys(phoneCountryMap).sort(function(a, b) { return b.length - a.length; });
          for (var pi = 0; pi < sortedPrefixes.length; pi++) {
            var prefix = sortedPrefixes[pi];
            if (phone.startsWith(prefix) || phone.startsWith(prefix.substring(1))) {
              update.country = phoneCountryMap[prefix].country;
              syncLog.fields_updated.push('country');
              console.log('[SYNC] Inferred country from phone:', update.country);
              break;
            }
          }
        }

        // If still no country, infer from known Indian cities
        if (!update.country && !user.country && (update.city || (contact && contact.city))) {
          var cityForCountry = update.city || contact.city || '';
          var indianCities = [
            'mumbai', 'delhi', 'new delhi', 'bangalore', 'bengaluru', 'hyderabad',
            'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow',
            'chandigarh', 'thane', 'navi mumbai', 'noida', 'greater noida',
            'gurgaon', 'gurugram', 'faridabad', 'ghaziabad',
            'vadodara', 'surat', 'rajkot', 'indore', 'bhopal',
            'nagpur', 'nashik', 'aurangabad',
            'coimbatore', 'madurai', 'kochi', 'trivandrum', 'thiruvananthapuram',
            'visakhapatnam', 'vijayawada',
            'patna', 'ranchi', 'dehradun', 'bhubaneswar', 'guwahati',
            'ludhiana', 'amritsar', 'jalandhar', 'mohali', 'panchkula',
            'mangalore', 'mysore', 'mysuru', 'hubli'
          ];
          var cityLowerC = cityForCountry.toLowerCase().trim();
          for (var ci = 0; ci < indianCities.length; ci++) {
            if (cityLowerC.startsWith(indianCities[ci]) || cityLowerC === indianCities[ci]) {
              update.country = 'India';
              syncLog.fields_updated.push('country');
              console.log('[SYNC] Inferred country from Indian city:', cityForCountry);
              break;
            }
          }
        }

        // === STATE INFERENCE ===
        // If state is empty and we have a city, infer the state
        if (!update.state && !user.state && (update.city || (contact && contact.city))) {
          var cityForState = update.city || contact.city || '';
          var cityToState = {
            'mumbai': 'Maharashtra', 'thane': 'Maharashtra', 'navi mumbai': 'Maharashtra',
            'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra',
            'aurangabad': 'Maharashtra',
            'delhi': 'Delhi', 'new delhi': 'Delhi',
            'noida': 'Uttar Pradesh', 'greater noida': 'Uttar Pradesh',
            'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh',
            'agra': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh',
            'gurgaon': 'Haryana', 'gurugram': 'Haryana', 'faridabad': 'Haryana',
            'panchkula': 'Haryana',
            'bangalore': 'Karnataka', 'bengaluru': 'Karnataka',
            'mangalore': 'Karnataka', 'mysore': 'Karnataka', 'mysuru': 'Karnataka',
            'hubli': 'Karnataka',
            'hyderabad': 'Telangana',
            'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu',
            'kolkata': 'West Bengal',
            'ahmedabad': 'Gujarat', 'vadodara': 'Gujarat', 'surat': 'Gujarat',
            'rajkot': 'Gujarat',
            'jaipur': 'Rajasthan', 'udaipur': 'Rajasthan', 'jodhpur': 'Rajasthan',
            'chandigarh': 'Chandigarh',
            'ludhiana': 'Punjab', 'amritsar': 'Punjab', 'jalandhar': 'Punjab',
            'mohali': 'Punjab',
            'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh',
            'kochi': 'Kerala', 'trivandrum': 'Kerala', 'thiruvananthapuram': 'Kerala',
            'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh',
            'patna': 'Bihar',
            'ranchi': 'Jharkhand',
            'dehradun': 'Uttarakhand',
            'bhubaneswar': 'Odisha',
            'guwahati': 'Assam',
            'ghaziabad': 'Uttar Pradesh'
          };
          var cityLowerS = cityForState.toLowerCase().trim();
          // Try exact match first
          if (cityToState[cityLowerS]) {
            update.state = cityToState[cityLowerS];
            syncLog.fields_updated.push('state');
            console.log('[SYNC] Inferred state:', update.state, 'from city:', cityForState);
          } else {
            // Try matching first word (e.g., 'Thane West' -> 'thane')
            var firstWord = cityLowerS.split(/[\s,]+/)[0];
            if (cityToState[firstWord]) {
              update.state = cityToState[firstWord];
              syncLog.fields_updated.push('state');
              console.log('[SYNC] Inferred state from first word:', update.state, 'from city:', cityForState);
            }
          }
        }
      }
    }

    // Experience years
    if (experience_years !== undefined && experience_years !== null) {
      const years = parseInt(experience_years, 10);
      if (!isNaN(years) && years >= 0) {
        update.yearsExperience = years;
        syncLog.fields_updated.push('yearsExperience');
      }
    }

    // Combine all skill arrays for matching
    const allSkills = [
      ...(Array.isArray(skills_technical) ? skills_technical : []),
      ...(Array.isArray(skills_frameworks) ? skills_frameworks : []),
      ...(Array.isArray(skills_domains) ? skills_domains : [])
    ];

    if (allSkills.length > 0) {
      const skillIds = await matchSkills(allSkills);
      syncLog.matched_skills = skillIds.length;
      syncLog.skills_input_count = allSkills.length;
      if (skillIds.length > 0) {
        update.skillIds = skillIds;
        syncLog.fields_updated.push('skillIds');
      }
    }

    // Industries
    const industryList = Array.isArray(industries) ? industries : [];
    if (industryList.length > 0) {
      const industryIds = await matchIndustries(industryList);
      syncLog.matched_industries = industryIds.length;
      syncLog.industries_input_count = industryList.length;
      if (industryIds.length > 0) {
        update.industryIds = industryIds;
        syncLog.fields_updated.push('industryIds');
      }
    }

    // Work history from profile_summary role_timeline (schema: [String])
    if (profile_summary && Array.isArray(profile_summary.role_timeline) && profile_summary.role_timeline.length > 0) {
      update.workHistory = profile_summary.role_timeline;
      syncLog.fields_updated.push('workHistory');
    }

    // Highlights from profile_summary expertise_areas (schema: [String])
    if (profile_summary && Array.isArray(profile_summary.expertise_areas) && profile_summary.expertise_areas.length > 0) {
      update.highlights = profile_summary.expertise_areas;
      syncLog.fields_updated.push('highlights');
    }

    // Apply update (use collection.updateOne to bypass Mongoose strict mode for workHistory)
    if (Object.keys(update).length > 0) {
      update.updatedAt = new Date();
      await DB.User.collection.updateOne({ _id: user._id }, { $set: update });
      console.log('[SYNC] Updated fields:', syncLog.fields_updated.join(', '));
    } else {
      console.log('[SYNC] No fields to update for:', user.email);
    }

    return res.status(200).json({
      success: true,
      user_id: user._id.toString(),
      email: user.email,
      sync_log: syncLog
    });

  } catch (err) {
    console.error('[SYNC] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
