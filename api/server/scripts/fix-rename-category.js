/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const categories = await DB.Category.find({});

    for (const cat of categories) {
      await DB.MyCategory.updateMany(
        {
          originalCategoryId: cat._id
        },
        {
          $set: {
            name: cat.name
          }
        }
      );
    }

    const subjects = await DB.Subject.find({});
    for (const sub of subjects) {
      await DB.MySubject.updateMany(
        {
          originalSubjectId: sub._id
        },
        {
          $set: {
            name: sub.name
          }
        }
      );
    }
    const topics = await DB.Topic.find({});
    for (const top of topics) {
      await DB.MyTopic.updateMany(
        {
          originalTopicId: top._id
        },
        {
          $set: {
            name: top.name
          }
        }
      );
    }
  } catch (e) {
    throw e;
  }
};
