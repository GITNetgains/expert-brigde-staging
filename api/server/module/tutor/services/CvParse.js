/**
 * CV/Resume parsing: extract text from PDF and use AI to structure data for tutor profile.
 */
const fs = require('fs');
const path = require('path');

const CV_EXTRACT_SCHEMA = `
Extract from the CV/resume text and return a single JSON object (no markdown, no code block) with exactly these keys:
- name (string): full name
- gender (string): gender if clearly stated (e.g. "male", "female", "non-binary"); otherwise null. Do NOT guess from the name.
- email (string): email if found, else null
- phoneNumber (string): phone if found, else null
- address (string): full address or null
- city (string): city or null
- state (string): state/region or null
- zipCode (string): postal/zip or null
- countryCode (string): ISO 2-letter country code if inferrable (e.g. US, IN, GB), else null
- countryName (string): country name if found, else null
- languages (array of strings): language codes or names (e.g. ["en","es"] or ["English","Spanish"])
- bio (string): summary/about/objective (1-3 sentences), else null
- highlights (array of strings): key skills or achievements as bullet points (max 8)
- yearsExperience (number): total years of experience if stated, else null
- skillNames (array of strings): technical/professional skills (e.g. ["JavaScript","Project Management"])
- skills (array of strings): same as skillNames (can repeat values)
- industryNames (array of strings): industries/sectors (e.g. ["Technology","Healthcare"])
- education (array of objects): each { "title": "degree/course", "organization": "school/university", "fromYear": number, "toYear": number }
- experience (array of objects): each { "title": "job title", "organization": "company", "fromYear": number, "toYear": number }

Use null for missing values. Use empty arrays [] when none found. Keep years as numbers (e.g. 2020 not "2020").
`;

/**
 * Extract raw text from a PDF file (local path).
 * @param {string} filePath - absolute or relative path to PDF
 * @returns {Promise<string>} extracted text
 */
async function extractTextFromPdf(filePath) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error('File not found');
  }
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(resolved);
  const data = await pdfParse(dataBuffer);
  return data.text || '';
}

/**
 * Call OpenAI/Azure to structure CV text into the schema.
 * @param {string} cvText - raw CV text
 * @returns {Promise<object>} structured profile data
 */
async function parseWithAI(cvText) {
  if (!cvText || cvText.trim().length < 50) {
    return {
      name: null,
      gender: null,
      email: null,
      phoneNumber: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      countryCode: null,
      countryName: null,
      languages: [],
      bio: null,
      highlights: [],
      yearsExperience: null,
      skillNames: [],
      skills: [],
      industryNames: [],
      education: [],
      experience: []
    };
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';

  if (!endpoint || !apiKey || !deployment) {
    throw new Error('CV parsing requires Azure OpenAI configuration (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT)');
  }

  const { AzureOpenAI } = require('openai');
  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment,
    apiVersion
  });

  const truncated = cvText.length > 12000 ? cvText.slice(0, 12000) + '\n...[truncated]' : cvText;
  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: 'system', content: 'You extract structured data from CV/resume text. Reply with a single valid JSON object only, no other text or markdown.' },
      { role: 'user', content: `${CV_EXTRACT_SCHEMA}\n\n--- CV TEXT ---\n${truncated}` }
    ],
    max_completion_tokens: 2000
  });

  let content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }
  content = content.trim();
  const codeBlock = content.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (codeBlock) {
    content = codeBlock[1].trim();
  }

  try {
    const parsed = JSON.parse(content);
    return {
      name: parsed.name ?? null,
      gender: parsed.gender ?? null,
      email: parsed.email ?? null,
      phoneNumber: parsed.phoneNumber ?? null,
      address: parsed.address ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      zipCode: parsed.zipCode ?? null,
      countryCode: parsed.countryCode ?? null,
      countryName: parsed.countryName ?? null,
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      bio: parsed.bio ?? null,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      yearsExperience: typeof parsed.yearsExperience === 'number' ? parsed.yearsExperience : null,
      skillNames: Array.isArray(parsed.skillNames) ? parsed.skillNames : [],
      // "skills" is an alias for skillNames so the frontend can bind more naturally
      skills: Array.isArray(parsed.skills)
        ? parsed.skills
        : Array.isArray(parsed.skillNames)
          ? parsed.skillNames
          : [],
      industryNames: Array.isArray(parsed.industryNames) ? parsed.industryNames : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : []
    };
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Parse CV from an uploaded media document (PDF).
 * @param {string} mediaId - Media._id of the uploaded PDF
 * @returns {Promise<object>} structured profile for tutor form
 */
async function parseCv(mediaId) {
  const DB = global.DB || {};
  const media = await DB.Media.findOne({ _id: mediaId });
  if (!media) {
    throw new Error('Document not found');
  }
  const filePath = media.filePath || media.originalPath;
  if (!filePath) {
    throw new Error('File path not found for document');
  }
  const mime = (media.mimeType || '').toLowerCase();
  if (!mime.includes('pdf')) {
    throw new Error('Only PDF documents are supported for CV parsing');
  }
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error('File not found on server');
  }
  const text = await extractTextFromPdf(resolved);
  return parseWithAI(text);
}

module.exports = {
  extractTextFromPdf,
  parseWithAI,
  parseCv
};
