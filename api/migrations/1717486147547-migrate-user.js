'use strict';

module.exports.up = async function (next) {
  const users = [
    {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@livelearn.info',
      password: 'PinlearnAdmin123#',
      isZoomAccount: true,
      emailVerified: true
    }
  ];

  for (const u of users) {
    let user = await DB.User.findOne({
      email: u.email
    });

    if (!user) {
      user = new DB.User(u);
    } else {
      user = {
        ...user,
        ...u
      };
    }

    await user.save();
  }
  console.log('Mirgate users success');
  next();

  next();
};

module.exports.down = function (next) {
  next();
};
