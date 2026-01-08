module.exports = async () => {
  try {
    const dataset = [
      {
        name: 'Business and Strategy',
        subjects: ['Business Planning', 'Business Process Improvement', 'Management Consulting', 'OKRs & Goal Setting', 'Operations Consulting', 'Startup Advisory', 'Supply Chain & Logistics', 'Other']
      },
      {
        name: 'Design & Creative',
        subjects: ['3D Modeling & Rendering', 'Brand Identity & Logo Design', 'Creative Direction', 'Graphic Design', 'Interior Design', 'Motion Graphics & Animation', 'Presentation Design', 'Product Design', 'Trade Show Design', 'UI/UX Design', 'Other']
      },
      {
        name: 'Education and Coaching',
        subjects: ['Career Coaching', 'Coding Tutoring', 'EdTech Consulting', 'Executive Coaching', 'Interview Preparation', 'Leadership Development', 'Public Speaking Coaching', 'Skills Training (Soft & Hard)', 'Other']
      },
      {
        name: 'Engineering & Architecture',
        subjects: ['Architectural Design', 'Building Information Modeling', 'CAD', 'Chemical & Process Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronic Engineering', 'Energy Engineering', 'Landscape Architecture', 'Mechanical Engineering', 'Structural Engineering', 'Other']
      },
      {
        name: 'Finance and Accounting',
        subjects: ['Audits & Compliance', 'Bookkeeping & Accounting', 'Budgeting & Forecasting', 'CFO Advisory', 'Financial Analysis & Modeling', 'Fund Raising/ M&A', 'Project Finance', 'Tax Advisory', 'Other']
      },
      {
        name: 'HR & People Operations',
        subjects: ['Compensation Strategy', 'Culture & Engagement', 'HR Administration', 'HR Policies & Compliance', 'Organizational Design', 'Performance Management', 'Talent Acquisition & Recruitment', 'Workforce Management', 'Other']
      },
      {
        name: 'Legal',
        subjects: ['Business & Corporate Law', 'Contract Drafting & Review', 'Employment & Labor Law', 'Immigration Law', 'Intellectual Property Law', 'Legal Virtual Assistance', 'Paralegal Services', 'Regulatory Compliance', 'Securities & Finance Law', 'Startup Legal Advisory', 'Tax Law', 'Other']
      },
      {
        name: 'Product and Project Management',
        subjects: ['Business Project Management', 'Construction & Engineering Project Management', 'Digital Project Management', 'Healthcare Project Management', 'MVP Planning', 'PMO Setup', 'Product Management (Agile, Scrum)', 'Product Roadmapping', 'Technical Project Management', 'Other']
      },
      {
        name: 'Research',
        subjects: ['General Research Services', 'Market Research', 'Qualitative Research', 'Quantitative Research', 'Web & Software Product Research', 'Other']
      },
      {
        name: 'Sales, Marketing and Customer Support',
        subjects: ['Account Management', 'B2B Sales Strategy', 'Brand Strategy', 'Campaign Management', 'Content Moderation', 'Content Strategy', 'CRM Setup & Optimization', 'Customer Experience (CX) Management', 'Customer Onboarding and Success', 'Digital Marketing Strategy', 'Ecommerce Management', 'Email, Phone & Chat Support', 'Lead Generation', 'Other']
      },
      {
        name: 'Technology & IT',
        subjects: ['AI & Machine Learning', 'AI Chatbot Development', 'AI Integration', 'Applications Development', 'AR/VR Development', 'Automation Testing', 'Back-End Development', 'Blockchain & NFT Development', 'Blockchain & Web3', 'Cloud', 'CMS Development', 'Cybersecurity', 'Data Science & Analytics', 'Database Administration', 'Database Development', 'DevOps', 'Ecommerce Website Development', 'Firmware Development', 'Front-End Development', 'Full Stack Development', 'IT Compliance, Support & System Admin', 'IT Infrastructure', 'Mobile App Development', 'Network and Information Security', 'QA & Testing', 'Software Engineering', 'Systems Administration and Engineering', 'Web, Mobile & Software Development', 'Other']
      }
    ];

    console.log('--- Starting Fresh Data Import ---');

    // 1. Sort Primary Categories A-Z
    dataset.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < dataset.length; i++) {
      const entry = dataset[i];

      // 2. Create New Category
      const newCategory = new DB.Category({
        name: entry.name,
        alias: Helper.String.createAlias(entry.name),
        description: entry.name,
        isActive: true,
        isFeatured: true, // Set to true to ensure it appears on the homepage
        ordering: i       // Maintains alphabetical order in the UI
      });
      await newCategory.save();

      // 3. Sort Subjects A-Z and Create them
      const sortedSubjects = entry.subjects.sort((a, b) => a.localeCompare(b));
      
      for (const subName of sortedSubjects) {
        const newSubject = new DB.Subject({
          name: subName,
          alias: Helper.String.createAlias(subName),
          isActive: true,
          categoryIds: [newCategory._id],
          price: 0
        });
        await newSubject.save();
      }
      
      console.log(`[Imported] Category: ${entry.name} (${entry.subjects.length} subjects)`);
    }

    console.log('--- Import Successfully Completed ---');

  } catch (e) {
    console.error('Error during import:', e);
    throw e;
  }
};