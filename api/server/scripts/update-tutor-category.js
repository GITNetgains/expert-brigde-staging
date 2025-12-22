/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const tutors = await DB.User.find({
      type: 'tutor'
    });
    await tutors.reduce(async (lp, tutor) => {
      await lp;
      const myCats = await DB.MyCategory.find({
        tutorId: tutor._id,
        isActive: true
      });
      if (myCats.length) {
        const myCatIds = myCats.map(item => item.originalCategoryId);
        await DB.User.update({
          _id: tutor._id
        }, {
          $addToSet: {
            categoryIds: myCatIds
          }
        });
      }
      const mySubs = await DB.MySubject.find({
        tutorId: tutor._id,
        isActive: true
      });
      if (mySubs.length) {
        const mySubIds = mySubs.map(item => item.originalSubjectId);
        await DB.User.update({
          _id: tutor._id
        }, {
          $addToSet: {
            subjectIds: mySubIds
          }
        });
      }
    }, Promise.resolve());
  } catch (e) {
    throw e;
  }
};
