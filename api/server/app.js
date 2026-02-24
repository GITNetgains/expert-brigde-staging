// =======================================================
// FIX FOR OPENAI SDK (CommonJS): Polyfill fetch, Headers, Request, Response, FormData
// Must complete before any code that uses OpenAI runs.
// =======================================================
const path = require('path');
const nconf = require('nconf');

process.env.LOCAL_ID = Math.random().toString(36).substring(7);

nconf
  .argv()
  .env()
  .file({ file: path.resolve(path.join(__dirname, 'config', `${process.env.NODE_ENV}.json`)) });

async function bootstrap() {
  // Polyfill globals required by OpenAI SDK (FormData can be missing in Node < 18)
  const fetchModule = await import("node-fetch");
  global.fetch = (...args) => fetchModule.default(...args);
  global.Headers = fetchModule.Headers;
  global.Request = fetchModule.Request;
  global.Response = fetchModule.Response;
  const { FormData } = await import("formdata-node");
  global.FormData = FormData;

  const Kernel = require('./kernel');
  const kernel = new Kernel();

  kernel.loadModule(require('./module/system'));
  kernel.loadModule(require('./module/user'));
  kernel.loadModule(require('./module/passport'));
  kernel.loadModule(require('./module/post'));
  kernel.loadModule(require('./module/media'));
  kernel.loadModule(require('./module/i18n'));
  kernel.loadModule(require('./module/newsletter'));
  kernel.loadModule(require('./module/banner'));
  kernel.loadModule(require('./module/tutor'));
  kernel.loadModule(require('./module/booking'));
  kernel.loadModule(require('./module/payment'));
  kernel.loadModule(require('./module/calendar'));
  kernel.loadModule(require('./module/payout'));
  kernel.loadModule(require('./module/refund'));
  kernel.loadModule(require('./module/review'));
  kernel.loadModule(require('./module/category'));
  kernel.loadModule(require('./module/topic'));
  kernel.loadModule(require('./module/coupon'));
  kernel.loadModule(require('./module/testimonial'));
  kernel.loadModule(require('./module/favorite'));
  kernel.loadModule(require('./module/message'));
  kernel.loadModule(require('./module/socket'));
  kernel.loadModule(require('./module/stats'));
  kernel.loadModule(require('./module/course'));
  kernel.loadModule(require('./module/zoomus'));
  kernel.loadModule(require('./module/meeting'));
  kernel.loadModule(require('./module/webinar'));
  kernel.loadModule(require('./module/lesson-space'));
  kernel.loadModule(require('./module/notification'));
  kernel.loadModule(require('./module/email-template'));
  kernel.loadModule(require('./module/report'));
  kernel.loadModule(require('./module/search'));
  kernel.loadModule(require('./module/sync'));

  kernel.compose();
  return kernel;
}

// Export a promise that resolves to kernel so callers can await readiness
const kernelPromise = bootstrap();

module.exports = kernelPromise;
