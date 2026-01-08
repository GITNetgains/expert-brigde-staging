/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const tutors = await DB.User.find({
      type: 'tutor'
    });
    await tutors.reduce(async (lp, tutor) => {
      await lp;
      const tutorCategoryIds = Array.isArray(tutor.categoryIds) ? tutor.categoryIds : [];
      const tutorSubjectIds = Array.isArray(tutor.subjectIds) ? tutor.subjectIds : [];

      if (tutorCategoryIds.length) {
        const categories = await DB.Category.find({ _id: { $in: tutorCategoryIds } });
        for (const cat of categories) {
          let myCat = await DB.MyCategory.findOne({
            tutorId: tutor._id,
            originalCategoryId: cat._id,
            isDeleted: false
          });
          if (!myCat) {
            myCat = new DB.MyCategory({
              tutorId: tutor._id,
              originalCategoryId: cat._id,
              name: cat.name,
              alias: cat.alias,
              isActive: true
            });
            await myCat.save();
          }
        }
      }

      if (tutorSubjectIds.length) {
        const subjects = await DB.Subject.find({ _id: { $in: tutorSubjectIds } });
        // Ensure MySubject exists for each tutor subject, associated with a matching MyCategory
        for (const subj of subjects) {
          // pick a category that the subject belongs to and the tutor also has
          const subjCatIds = Array.isArray(subj.categoryIds) ? subj.categoryIds.map(id => id.toString()) : [];
          const tutorCatIdsStr = tutorCategoryIds.map(id => id.toString());
          const matchedCatIdStr = subjCatIds.find(id => tutorCatIdsStr.includes(id)) || tutorCatIdsStr[0];
          let myCatForSubject = null;
          if (matchedCatIdStr) {
            myCatForSubject = await DB.MyCategory.findOne({
              tutorId: tutor._id,
              originalCategoryId: matchedCatIdStr,
              isDeleted: false
            });
            if (!myCatForSubject) {
              const cat = await DB.Category.findOne({ _id: matchedCatIdStr });
              if (cat) {
                myCatForSubject = new DB.MyCategory({
                  tutorId: tutor._id,
                  originalCategoryId: cat._id,
                  name: cat.name,
                  alias: cat.alias,
                  isActive: true
                });
                await myCatForSubject.save();
              }
            }
          }
          // create mySubject if missing
          const existingMySubject = await DB.MySubject.findOne({
            tutorId: tutor._id,
            originalSubjectId: subj._id,
            ...(myCatForSubject ? { myCategoryId: myCatForSubject._id } : {}),
            isDeleted: false
          });
          if (!existingMySubject) {
            const mySubjectPayload = {
              tutorId: tutor._id,
              originalSubjectId: subj._id,
              name: subj.name,
              alias: subj.alias,
              isActive: true
            };
            if (myCatForSubject) {
              mySubjectPayload.myCategoryId = myCatForSubject._id;
            }
            const mySubject = new DB.MySubject(mySubjectPayload);
            await mySubject.save();
          }
        }
      }

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
