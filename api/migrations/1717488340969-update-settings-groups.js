'use strict';
module.exports.up = async function (next) {
  const general = [
    'siteName',
    'twitterLink',
    'siteLogo',
    'instagramLink',
    'siteFavicon',
    'contactPhone',
    'contactEmail',
    'facebookLink',
    'siteBanner',
    'signupImage'
  ];

  const SEO = ['homeSEO', 'script'];

  const images = ['homepagePicture', 'howItWorkPicture'];

  const commission = ['commissionRate', 'commissionCourse', 'currency', 'currencySymbol'];

  const smtp = ['smtpTransporter', 'sengridKey'];

  const stripe = ['stripeKey'];

  const other = [
    'youtubeHowItWork',
    'maxFreeSlotToBook',
    'teachwithusStudents',
    'teachwithusLanguages',
    'teachwithusCourses',
    'teachwithusCountries',
    'teachwithusCustomers',
    'helloBar'
  ];

  const platformOnline = ['platformOnline'];

  const settingByGroup = {
    general,
    seo: SEO,
    image: images,
    commission: commission,
    smtp: smtp,
    stripe,
    other,
    platform: platformOnline
  };

  try {
    const groupKeys = Object.keys(settingByGroup);
    for (const group of groupKeys) {
      console.log(settingByGroup[group]);
      await DB.Config.updateMany(
        {
          key: { $in: settingByGroup[group] }
        },
        {
          $set: { group: group }
        }
      );
    }
  } catch (error) {
    console.log(error);
  }

  console.log('Update settings group success!');
  next();
};

module.exports.down = function (next) {
  next();
};
