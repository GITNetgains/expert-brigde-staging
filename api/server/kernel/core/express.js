//navjot 
/* eslint no-param-reassign: 0 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const methodOverride = require('method-override');
const morgan = require('morgan');
const SwigEngine = require('swig').Swig;
const info = require('../../../package.json');
const nconf = require('nconf');

const swig = new SwigEngine();

exports.name = 'kernel-app';

exports.config = {
  publicPath: path.resolve('./public')
  // APIDocsPath: path.resolve('./docs')
};

// Expose app
exports.core = kernel => {
  kernel.addProp('app', express());
  const app = kernel.app;

  app.engine('swig', swig.renderFile);
  app.engine('html', swig.renderFile);
  app.set('view engine', 'swig');
  app.set('views', path.join(__dirname, '..', '..', 'views'));
  app.set('view cache', false);
  app.disable('x-powered-by');
  app.set('etag', false);
  app.locals.baseUrl = nconf.get('baseUrl');

  // Whitelist for CORS
  const whitelist = [
    nconf.get('userWebUrl')?.trim() || 'http://localhost:4200',
    nconf.get('adminURL')?.trim() || 'http://localhost:1337',
    'https://www.expertbridge.co',
    'http://localhost:9000',
    'http://localhost:4200',
    'http://localhost:1337',
    'http://127.0.0.1:9000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:1337',
    'https://expertbridge.co',
    'https://admin.expertbridge.co',
    'https://api.expertbridge.co'
  ];

  const whitelistPublic = [
    'avatar',
    'assets',
    'audios',
    'photos',
    'files',
    'invoices',
    'documents',
    'verifyEmail',
    'videos',
    'passwordReset',
    'hook',
    'flags-png'
  ];

  const checkOriginalUrl = originalUrl => {
    return whitelistPublic.some(item => originalUrl.includes(item));
  };

  const getHostnameFromUrl = value => {
    if (!value || typeof value !== 'string') return null;
    try {
      return new URL(value).hostname;
    } catch (e) {
      return null;
    }
  };

  const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin');
    const referrer = req.header('Referer') || req.header('Referrer');
    const host = req.get('host');

    if (!origin && !referrer) {
      callback(null, { origin: false });
      return;
    }

    const requestHost = host ? host.split(':')[0] : null;
    const originHost = getHostnameFromUrl(origin);
    const referrerHost = getHostnameFromUrl(referrer);

    if (
      whitelist.includes(origin) ||
      whitelist.includes(referrer) ||
      (requestHost && originHost && requestHost === originHost) ||
      (requestHost && referrerHost && requestHost === referrerHost) ||
      host === nconf.get('host') ||
      checkOriginalUrl(req.originalUrl)
    ) {
      callback(null, { origin: true, credentials: true });
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };

  // Enable CORS
  if (process.env.ALLOW_CORS) {
    if (process.env.NODE_ENV === 'development') {
      // Dev: allow all origins and handle preflight
      app.use(cors({ origin: true, credentials: true }));
      app.options('*', cors({ origin: true, credentials: true }));
    } else {
      // Production: use delegate
      app.use(cors(corsOptionsDelegate));
      app.options('*', cors(corsOptionsDelegate));
    }
  }

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  app.use((req, res, next) => {
    const url = req.originalUrl || '';
    if (url.startsWith('/v1/')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
      res.removeHeader('ETag');
    }
    next();
  });

  if (process.env.NODE_ENV === 'production') {
    // log only 4xx and 5xx responses to console
    app.use(
      morgan('dev', {
        skip(req, res) {
          return res.statusCode < 400;
        }
      })
    );
  } else {
    app.use(morgan('dev'));
  }

  // app.use(express.static(exports.config.publicPath));
  //navjot
  // app.use('/public', express.static(exports.config.publicPath));
  app.use(express.static(exports.config.publicPath));
  // app.use('/docs', express.static(exports.config.APIDocsPath));

  app.get('/api-author', (req, res) => {
    res.status(200).send({
      author: 'Tuong Tran <tuong.tran@outlook.com>',
      appName: info.name,
      version: info.version
    });
  });
};
