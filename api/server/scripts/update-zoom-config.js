module.exports = async () => {
  try {
    await DB.Config.remove({ key: 'platformOnline' });
    await DB.Config.create({
      key: 'platformOnline',
      value: {
        platform: process.env.PLATFORM_ONLINE || 'zoomus', // zoomus | lessonspace
        zoomus: {
          sdk: {
            clientId: '',
            clientSecret: ''
          },
          oauthServerToServer: {
            accountId: '',
            clientId: '',
            clientSecret: '',
            secretToken: ''
          }
        },
        lessonspace: {
          hookUrl: '',
          apiKey: '',
          organisationId: ''
        }
      },
      group: 'platform',
      name: 'Platform to learn online',
      description: 'Platform to learn online',
      public: false,
      type: 'mixed',
      ordering: 17
    });

    console.log('Mirgate update platform config successfully');
  } catch (error) {
    console.log(error);
  }
};
