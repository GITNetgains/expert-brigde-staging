/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
require('../app');

(async () => {
  try {
    const countries = [
      { name: 'United States', code: 'US', states: ['California', 'Texas', 'New York'] },
      { name: 'Canada', code: 'CA', states: ['Ontario', 'British Columbia', 'Quebec'] },
      { name: 'India', code: 'IN', states: ['Maharashtra', 'Karnataka', 'Delhi'] }
    ];

    const categories = await DB.Category.find({ isActive: true }).exec();
    if (!categories.length) {
      console.log('No active categories found');
      process.exit(0);
    }

    let counter = 0;
    let created = 0;
    for (const cat of categories) {
      for (let i = 1; i <= 3; i += 1) {
        const c = countries[(counter + i) % countries.length];
        const state = c.states[i % c.states.length];
        const alias = (cat.alias || cat.name || 'category').toLowerCase().replace(/\s+/g, '_');
        const suffix = (cat._id ? cat._id.toString().slice(-6) : `${counter}`);
        const name = `Seed Tutor ${alias} ${i}`;
        const username = `${alias}-${suffix}-${i}`;
        const email = `seed_${alias}_${suffix}_${i}@example.test`;

        const exists = await DB.User.findOne({ email }).select('_id').lean();
        if (exists) continue;

        const payload = {
          name,
          username,
          email,
          password: 'Test1234',
          isActive: true,
          emailVerified: true,
          rejected: false,
          pendingApprove: false,
          type: 'tutor',
          languages: ['en'],
          yearsExperience: i * 2,
          consultationFee: 20 + i * 10,
          country: { name: c.name, code: c.code },
          countryCode: c.code,
          state,
          bio: 'Seeded tutor for filter testing',
          highlights: ['experienced', 'patient'],
          workHistory: ['Company A', 'Company B']
        };

        const tutor = await Service.User.create(payload);
        await DB.User.update(
          { _id: tutor._id },
          { $addToSet: { categoryIds: { $each: [cat._id] } } }
        );
        created += 1;
      }
      counter += 1;
    }
    console.log('Seeded tutors created:', created);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

