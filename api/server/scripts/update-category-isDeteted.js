/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    await DB.MyCategory.updateMany({}, { isDeleted: false });
    await DB.MySubject.updateMany({}, { isDeleted: false });
    await DB.MyTopic.updateMany({}, { isDeleted: false });
  } catch (e) {
    throw e;
  }
};
