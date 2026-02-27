const tutorDto = require('../../tutor/dto');

exports.favorite = async (userId, options) => {
  const tutor = await DB.User.findOne({ _id: options.tutorId });
  if (!tutor) {
    throw new Error('Tutor not found');
  }
  const user = await DB.User.findOne({ _id: userId });
  if (!user) {
    throw new Error('User not found');
  }

  let favorite = await DB.Favorite.findOne({ tutorId: options.tutorId, userId });
  if (!favorite) {
    favorite = new DB.Favorite({ tutorId: options.tutorId, userId, type: 'tutor' });
    await favorite.save();
  }

  return favorite;
};

exports.unFavorite = async (userId, tutorId) => {
  const favorite = await DB.Favorite.findOne({ tutorId, userId });
  if (!favorite) {
    throw new Error('Favorite not found');
  }
  await favorite.remove();
  return { success: true };
};

exports.isFavorite = async items => {
  return items.length
    ? items.map(item => {
        if (item.tutor) {
          // Use tutor DTO so commissionRate and price1On1Class are preserved
          const data = tutorDto.toResponse(item.tutor);
          data.isFavorite = true;
          if (data.country && data.country.code) {
            data.country.flag = new URL(
              `flags-png/${data.country.code.toLowerCase()}.png`,
              process.env.baseUrl
            ).href;
          }
          return data;
        }
      })
    : [];
};
