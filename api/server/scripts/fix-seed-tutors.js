/* eslint no-restricted-syntax: 0 */
require('../app');

(async () => {
  try {
    const filter = { email: { $regex: /^seed_/ } };

    const skills = await DB.Skill.find({}).limit(5).select('_id').lean();
    const skillIds = skills.map(s => s._id);

    const tutors = await DB.User.find(filter).select('_id categoryIds email consultationFee').lean();
    let modified = 0;
    for (const t of tutors) {
      const subjects = await DB.Subject.find({
        isActive: true,
        ...(t.categoryIds && t.categoryIds.length ? { categoryIds: { $in: t.categoryIds } } : {})
      })
        .limit(5)
        .select('_id')
        .lean();
      const subjectIds = subjects.map(s => s._id);

      const randRating = Math.round((3 + Math.random() * 2) * 10) / 10;
      const totalRating = Math.floor(20 + Math.random() * 180);
      const yearsExp = Math.floor(2 + Math.random() * 8);
      const fee = t.consultationFee && t.consultationFee > 0 ? t.consultationFee : Math.floor(20 + Math.random() * 80);

      const update = {
        $set: {
          type: 'tutor',
          rejected: false,
          pendingApprove: false,
          isActive: true,
          emailVerified: true,
          isHomePage: true,
          featured: true,
          isZoomAccount: true,
          ratingAvg: randRating,
          totalRating: totalRating,
          ratingScore: Math.round(randRating * totalRating),
          yearsExperience: yearsExp,
          consultationFee: fee,
          city: 'Sample City',
          zipCode: '12345'
        },
        $addToSet: {
          skillIds: { $each: skillIds },
          subjectIds: { $each: subjectIds }
        }
      };

      const res = await DB.User.update({ _id: t._id }, update);
      modified += res.nModified || res.modifiedCount || 0;
    }

    const count = await DB.User.count({
      email: { $regex: /^seed_/ },
      type: 'tutor',
      rejected: false,
      pendingApprove: false,
      isActive: true,
      emailVerified: true,
      isHomePage: true,
      featured: true,
      isZoomAccount: true
    });
    console.log('Modified:', modified);
    console.log('Ready tutor profiles:', count);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
