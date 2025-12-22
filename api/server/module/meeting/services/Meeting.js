exports.isPlatform = async platform => {
  const platformConfig = await DB.Config.findOne({ key: 'platformOnline' });
  return platformConfig.value.platform === platform;
};
