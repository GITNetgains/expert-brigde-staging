const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const appPromise = require('../server/app');
const SeedUser = require('./helpers/seed-user');
const SeedConfig = require('../server/migrations/config');
const SeedMedia = require('./helpers/seed-media');
const Cleanup = require('./helpers/clean-up');

global.expect = require('chai').expect;

before(async () => {
  const kernel = await appPromise;
  global.request = require('supertest')(kernel.app);
  global.testUtil = require('./util')(global.request);

  await SeedConfig();
  const userData = await SeedUser();
  global.admin = userData.admin;
  global.user = userData.user;
  global.media = await SeedMedia();

  const body = await testUtil.request(
    'post',
    '/v1/auth/login',
    null,
    {
      email: 'admin@example.com',
      password: 'admin'
    }
  );

  global.adminToken = body.token;

  const userBody = await testUtil.request(
    'post',
    '/v1/auth/login',
    null,
    {
      email: 'test@example.com',
      password: 'test'
    }
  );

  global.userToken = userBody.token;
});

after(async () => {
  await Cleanup();
  setTimeout(process.exit, 5000);
});

require('./integrations');
// require('./services');
