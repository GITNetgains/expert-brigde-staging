require('../app');

(async () => {
  try {
    const tutorCount = await DB.User.count({ type: 'tutor' });
    const seedCount = await DB.User.count({ email: { $regex: /^seed_/ } });
    const sample = await DB.User.find({ type: 'tutor' })
      .limit(5)
      .select('email type role username country state rejected pendingApprove')
      .lean();

    console.log('Tutors count:', tutorCount);
    console.log('Seed email count:', seedCount);
    console.log('Sample tutors:', JSON.stringify(sample, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

