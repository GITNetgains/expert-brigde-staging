/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */

module.exports = async () => {
  try {
    const tutorsData = [
      {
        name: 'Mohammed Ali',
        username: 'mohammedali',
        email: 'mohammed.ali@example.com',
        address: 'Deira, Dubai',
        state: 'Dubai',
        zipCode: '0',
        countryCode: 'AE',
        timezone: 'Asia/Dubai',
        avatar: 'https://images.pexels.com/photos/30004322/pexels-photo-30004322.jpeg',
        categoryName: 'Technology & IT',
        subjectNames: ['Web, Mobile & Software Development', 'Back-End Development'],
        highlights: ['Expert in legacy PHP systems'],
        gender: 'male',
        introVideo: 'https://www.pexels.com/video/3807748/',
        languages: ['en', 'ar'],
        phoneNumber: '5012335962',
        consultationFee: 20,
        skills: ['Core PHP', 'MySQL', 'HTML', 'JavaScript'],
        yearsExperience: 10
      },
      {
        name: 'Priya Nair',
        username: 'priyanair',
        email: 'priya.nair@example.com',
        address: 'Kakkanad, Kochi',
        state: 'Kerala',
        zipCode: '682030',
        countryCode: 'IN',
        timezone: 'Asia/Kolkata',
        avatar: 'https://images.pexels.com/photos/30450838/pexels-photo-30450838.jpeg',
        categoryName: 'Design & Creative',
        subjectNames: ['UI/UX Design', 'Product Design'],
        highlights: ['Designed 40+ mobile-first applications'],
        gender: 'female',
        introVideo: 'https://www.pexels.com/video/3182771/',
        languages: ['en', 'ml'],
        phoneNumber: '8899776564',
        consultationFee: 35,
        skills: ['UI Design', 'UX Research', 'Wireframing'],
        yearsExperience: 6
      },
      {
        name: 'Emily Carter',
        username: 'emilycarter',
        email: 'emily.c@example.com',
        address: 'Austin Downtown, Texas',
        state: 'Texas',
        zipCode: '73301',
        countryCode: 'US',
        timezone: 'America/Chicago',
        avatar: 'https://images.pexels.com/photos/9769875/pexels-photo-9769875.jpeg',
        categoryName: 'Sales, Marketing and Customer Support',
        subjectNames: ['Campaign Management', 'Digital Marketing Strategy'],
        highlights: ['Managed $1M+ ad spend with 4x ROI'],
        gender: 'female',
        introVideo: 'https://www.pexels.com/video/3182820/',
        languages: ['en'],
        phoneNumber: '1000060',
        consultationFee: 60,
        skills: ['Google Ads', 'Facebook Ads', 'Analytics'],
        yearsExperience: 5
      },
      {
        name: 'Neha Gupta',
        username: 'nehagupta',
        email: 'neha.g@example.com',
        address: 'Sector 62, Noida',
        state: 'Uttar Pradesh',
        zipCode: '201301',
        countryCode: 'IN',
        timezone: 'Asia/Kolkata',
        avatar: 'https://images.pexels.com/photos/27419512/pexels-photo-27419512.jpeg',
        categoryName: 'Sales, Marketing and Customer Support',
        subjectNames: ['Digital Marketing Strategy', 'Lead Generation'],
        highlights: ['Ranked 300+ keywords on Google'],
        gender: 'female',
        introVideo: 'https://www.pexels.com/video/3861483/',
        languages: ['en', 'hi'],
        phoneNumber: '9988776564',
        consultationFee: 40,
        skills: ['SEO', 'Content Strategy', 'Google Search Console'],
        yearsExperience: 7
      },
      {
        name: 'Karan Mehta',
        username: 'karanmehta',
        email: 'karan.m@example.com',
        address: 'Navrangpura, Ahmedabad',
        state: 'Gujarat',
        zipCode: '380009',
        countryCode: 'IN',
        timezone: 'Asia/Kolkata',
        avatar: 'https://images.pexels.com/photos/11164326/pexels-photo-11164326.jpeg',
        categoryName: 'Technology & IT',
        subjectNames: ['CMS Development', 'Web, Mobile & Software Development'],
        highlights: ['Built 150+ custom WordPress websites'],
        gender: 'male',
        introVideo: 'https://www.pexels.com/video/3807739/',
        languages: ['en', 'hi'],
        phoneNumber: '9012345587',
        consultationFee: 20,
        skills: ['WordPress', 'PHP', 'Elementor', 'WooCommerce'],
        yearsExperience: 9,
      },
      {
        name: 'Vikram Singh',
        username: 'vikramsingh',
        email: 'vikram.s@example.com',
        address: 'Mansarovar, Jaipur',
        state: 'Rajasthan',
        zipCode: '302020',
        countryCode: 'IN',
        timezone: 'Asia/Kolkata',
        avatar: 'https://images.pexels.com/photos/32064778/pexels-photo-32064778.jpeg',
        categoryName: 'Technology & IT',
        subjectNames: ['Software Engineering', 'Back-End Development'],
        highlights: ['Enterprise-grade Java applications'],
        gender: 'male',
        introVideo: 'https://www.pexels.com/video/3811117/',
        languages: ['en', 'hi'],
        phoneNumber: '9345678032',
        consultationFee: 35,
        skills: ['Java', 'Spring Boot', 'Hibernate', 'REST APIs'],
        yearsExperience: 8
      },
      {
        name: 'Laura Martinez',
        username: 'lauramartinez',
        email: 'laura.m@example.com',
        address: 'Miami Beach, Florida',
        state: 'Florida',
        zipCode: '33139',
        countryCode: 'US',
        timezone: 'America/New_York',
        avatar: 'https://images.pexels.com/photos/30004324/pexels-photo-30004324.jpeg',
        categoryName: 'Sales, Marketing and Customer Support',
        subjectNames: ['Digital Marketing Strategy', 'Campaign Management'],
        highlights: ['Grew brands to 200K+ followers'],
        gender: 'female',
        introVideo: 'https://www.pexels.com/video/3861473/',
        languages: ['en', 'es'],
        phoneNumber: '868040',
        consultationFee: 40,
        skills: ['Social Media Strategy', 'Instagram Ads'],
        yearsExperience: 6
      },
      {
        name: 'Chen Wei',
        username: 'chenwei',
        email: 'chen.wei@example.com',
        address: 'Pudong, Shanghai',
        state: 'Shanghai',
        zipCode: '200120',
        countryCode: 'CN',
        timezone: 'Asia/Shanghai',
        avatar: 'https://images.pexels.com/photos/30712821/pexels-photo-30712821.jpeg',
        categoryName: 'Technology & IT',
        subjectNames: ['Mobile App Development', 'Software Engineering'],
        highlights: ['High-performance Android apps'],
        gender: 'male',
        introVideo: 'https://www.pexels.com/video/3182770/',
        languages: ['en', 'zh'],
        phoneNumber: '13800137914',
        consultationFee: 50,
        skills: ['Android', 'Kotlin', 'Firebase'],
        yearsExperience: 8
      },
      {
        name: 'Fatima Khan',
        username: 'fatimakhan',
        email: 'fatima.k@example.com',
        address: 'DHA Phase 5, Karachi',
        state: 'Sindh',
        zipCode: '75500',
        countryCode: 'PK',
        timezone: 'Asia/Karachi',
        avatar: 'https://images.pexels.com/photos/31431922/pexels-photo-31431922.jpeg',
        categoryName: 'Design & Creative',
        subjectNames: ['Graphic Design', 'Brand Identity & Logo Design'],
        highlights: ['Brand identities for global clients'],
        gender: 'female',
        introVideo: 'https://www.pexels.com/video/3811118/',
        languages: ['en', 'ur'],
        phoneNumber: '123477525',
        consultationFee: 25,
        skills: ['Logo Design', 'Branding', 'Photoshop'],
        yearsExperience: 6
      },
      {
        name: 'Daniel Novak',
        username: 'danielnovak',
        email: 'daniel.n@example.com',
        address: 'Delhi, Delhi',
        state: 'Delhi',
        zipCode: '12000',
        countryCode: 'IN',
        timezone: 'Europe/Prague',
        avatar: 'https://images.pexels.com/photos/35270105/pexels-photo-35270105.jpeg',
        categoryName: 'Technology & IT',
        subjectNames: ['Software Engineering', 'Back-End Development'],
        highlights: ['Scalable data-driven systems'],
        gender: 'male',
        introVideo: 'https://www.pexels.com/video/3861491/',
        languages: ['en', 'cs'],
        phoneNumber: '93660',
        consultationFee: 45,
        skills: ['Python', 'Django', 'APIs', 'PostgreSQL'],
        yearsExperience: 10
      }
    ];

    console.log('--- Seeding Remaining Tutors ---');

    for (const data of tutorsData) {
      const existingUser = await DB.User.findOne({ email: data.email });
      if (existingUser) continue;

      let category = await DB.Category.findOne({ name: data.categoryName });
      if (!category) {
        category = await DB.Category.findOne({ alias: Helper.String.createAlias(data.categoryName) });
      }
      let subjects = await DB.Subject.find({ name: { $in: data.subjectNames } });
      if (!subjects || !subjects.length) {
        const aliases = data.subjectNames.map(n => Helper.String.createAlias(n));
        subjects = await DB.Subject.find({ alias: { $in: aliases } });
      }

      const baseHighlights = Array.isArray(data.highlights) ? data.highlights.filter(Boolean) : [data.highlights].filter(Boolean);

      const extraHighlightsByCategory = {
        'Technology & IT': [
          'Built scalable, secure systems',
          'Optimized performance and reliability',
          'Implemented CI/CD and automated testing'
        ],
        'Design & Creative': [
          'Human-centered design approach',
          'Rapid prototyping and usability testing',
          'Brand consistency and visual storytelling'
        ],
        'Sales, Marketing and Customer Support': [
          'Data-driven campaign execution',
          'Audience growth and engagement',
          'Conversion optimization (CRO) and CRM workflows'
        ]
      };
      const extras = extraHighlightsByCategory[data.categoryName] || [
        'Delivered measurable outcomes',
        'Collaborated with cross-functional teams',
        'On-time delivery with quality focus'
      ];

      while (baseHighlights.length < 3) {
        const next = extras[baseHighlights.length % extras.length];
        if (!baseHighlights.includes(next)) baseHighlights.push(next);
      }

      const payload = {
        name: data.name,
        username: data.username,
        email: data.email,
        password: 'Password123!',
        role: 'tutor',
        type: 'tutor',
        address: data.address,
        state: data.state,
        zipCode: data.zipCode,
        countryCode: data.countryCode,
        timezone: data.timezone,
        avatar: data.avatar,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        rejected: false,
        pendingApprove: false, // This makes them "Approved"
        isZoomAccount: true,
        featured: true,
        isHomePage: true,
        languages: data.languages,
        phoneNumber: data.phoneNumber,
        consultationFee: data.consultationFee,
        yearsExperience: data.yearsExperience,
        highlights: baseHighlights,
        categoryIds: category ? [category._id] : [],
        subjectIds: subjects.map(s => s._id),
        ratingAvg: 5,
        ratingScore: 5,
        totalRating: 1,
        completedByLearner: 5,
        commissionRate: 10,
        notificationSettings: true
      };

      const tutor = await Service.User.create(payload);

      if (category) {
        await DB.User.update(
          { _id: tutor._id },
          { $addToSet: { categoryIds: { $each: [category._id] } } }
        );
      }
      if (subjects && subjects.length) {
        const subjectIds = subjects.map(s => s._id);
        await DB.User.update(
          
          { _id: tutor._id },
          { $addToSet: { subjectIds: { $each: subjectIds } } }
        );
        let myCategoryDoc = null;
        if (category) {
          myCategoryDoc = await DB.MyCategory.findOne({
            tutorId: tutor._id,
            originalCategoryId: category._id,
            isDeleted: false
          });
          if (!myCategoryDoc) {
            myCategoryDoc = new DB.MyCategory({
              tutorId: tutor._id,
              originalCategoryId: category._id,
              name: category.name,
              alias: category.alias,
              isActive: true
            });
            await myCategoryDoc.save();
          }
        }
        if (myCategoryDoc) {
          for (const subj of subjects) {
            let mySubjectDoc = await DB.MySubject.findOne({
              tutorId: tutor._id,
              myCategoryId: myCategoryDoc._id,
              originalSubjectId: subj._id,
              isDeleted: false
            });
            if (!mySubjectDoc) {
              mySubjectDoc = new DB.MySubject({
                tutorId: tutor._id,
                myCategoryId: myCategoryDoc._id,
                originalSubjectId: subj._id,
                name: subj.name,
                alias: subj.alias,
                isActive: true
              });
              await mySubjectDoc.save();
            }
          }
        }
      }
      console.log(`[Seeded] Tutor: ${tutor.name}`);
    }

    console.log('--- All Tutors Successfully Added ---');
  } catch (e) {
    console.error('Migration Error:', e);
    throw e;
  }
};
