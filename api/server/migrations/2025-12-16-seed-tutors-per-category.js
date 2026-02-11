/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */

module.exports.up = async function(next) {
  try {
    const countries = [
      { name: 'United States', code: 'US', states: ['California', 'Texas', 'New York'] },
      { name: 'Canada', code: 'CA', states: ['Ontario', 'British Columbia', 'Quebec'] },
      { name: 'India', code: 'IN', states: ['Maharashtra', 'Karnataka', 'Delhi'] }
    ];

    const categories = await DB.Category.find({ isActive: true });
    let counter = 0;
    for (const cat of categories) {
      for (let i = 1; i <= 3; i += 1) {
        const c = countries[(counter + i) % countries.length];
        const state = c.states[i % c.states.length];
        const alias = (cat.alias || cat.name || 'category').toLowerCase().replace(/\s+/g, '_');
        const name = `Seed Tutor ${alias} ${i}`;
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
          isZoomAccount: true,
          bio: 'Seeded tutor for filter testing',
          highlights: ['experienced', 'patient']
        };

        const tutor = await Service.User.create(payload);

        await DB.User.update(
          { _id: tutor._id },
          { $addToSet: { categoryIds: { $each: [cat._id] } } }
        );
      }
      counter += 1;
    }

    next();
  } catch (e) {
    console.log(e);
    next(e);
  }
};

module.exports.down = async function(next) {
  try {
    const tutors = await DB.User.find({ type: 'tutor', email: { $regex: /^seed_/ } });
    for (const t of tutors) {
      await t.remove();
    }
    next();
  } catch (e) {
    next(e);
  }
};
