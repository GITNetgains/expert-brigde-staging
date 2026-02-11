const path = require('path');
const nconf = require('nconf');
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');

const sparkPostTransport = require('nodemailer-sparkpost-transport');
const pepipostTransport = require('nodemailer-pepipost-transport');
const Queue = require('./queue');

const swig = require('./template-engine').getSwigEngine();

const mailFrom = nconf.get('mailFrom');
console.log('mailFrom', mailFrom);
const viewsPath = path.join(__dirname, '..', '..', 'emails');
const sendgridApiKey = nconf.get('SENDGRID_API_KEY');
const emailQ = Queue.create('email');
const { readFileSync, writeFile } = require('fs');

function Mailer(options) {
  this.transport = nodemailer.createTransport(options);
}

Mailer.prototype.render = function render(template, options, content = '') {
  return swig.renderFile(path.join(viewsPath, 'layouts', 'default.html'), options || {}).replace('[[BODY]]', content);
};

Mailer.prototype.renderFromString = function renderFromString(str, options) {
  return swig.render(str, {
    locals: options || {}
  });
};

Mailer.prototype.send = async function send(opts) {
  try {
    const options = opts || {};
    return this.transport.sendMail(options);
  } catch (e) {
    // Log error without exposing sensitive data
    console.error('Send mail error:', {
      message: e.message,
      code: e.code,
      to: options.to,
      subject: options.subject
      // DO NOT log the full error object which may contain API keys
    });
    throw e; // Re-throw to be handled by caller
  }
};

Mailer.prototype.sendMail = async function sendMail(template, email, options) {
  try {
    const user = await DB.User.findOne({ email });
    if (!user || (user && user.notificationSettings)) {
      const configs = await DB.Config.find({
        public: true,
        key: {
          $in: ['facebookLink', 'twitterLink', 'instagramLink', 'siteLogo', 'siteName', 'currencySymbol']
        }
      }).exec();
      const data = {};
      configs.forEach(item => {
        data[item.key] = item.value;
      });
      const newOptions = Object.assign(options, {
        appConfig: {
          baseUrl: nconf.get('baseUrl'),
          userWebUrl: nconf.get('userWebUrl'),
          adminWebUrl: nconf.get('adminWebUrl'),
          logoUrl: data.siteLogo || nconf.get('logoUrl'),
          siteName: data.siteName || nconf.get('SITE_NAME'),
          facebookUrl: data.facebookLink || nconf.get('facebookUrl'),
          twitterUrl: data.twitterLink || nconf.get('twitterUrl'),
          instagramUrl: data.instagramLink || nconf.get('instagramUrl') || '',
          currencySymbol: data.currencySymbol || '$'
        }
      });
      const emailTemplate = await DB.EmailTemplate.findOne({
        key: template
      });
      if (emailTemplate && emailTemplate.content) {
        const body = swig.render(emailTemplate.content, {
          locals: newOptions || {}
        });
        const output = this.render(emailTemplate.path, newOptions, body);
        let subject = emailTemplate.subject || options.subject;
        if (emailTemplate.subject_replace_fields && emailTemplate.subject_replace_fields.length > 0 && options.subject_replace_fields) {
          const replaceKeys = Object.keys(options.subject_replace_fields);
          if (replaceKeys && replaceKeys.length > 0) {
            for (const key of replaceKeys) {
              subject = subject.replace(`#${key}`, options.subject_replace_fields[key]);
            }
          }
        }
        const resp = await this.send({
          to: email,
          from: options.from || mailFrom,
          subject: subject,
          html: output
        });

        return resp;
      } else {
        console.error('No email template found for:', template);
      }
    }
    return true;
  } catch (e) {
    throw e;
  }
};

Mailer.prototype.close = () => this.transport.close();

let mailer;

async function init() {
  const mailService = nconf.get('MAIL_SERVICE');
  const smtpValue = await DB.Config.findOne({ key: 'smtpTransporter' });
  
  if (mailService === 'sparkpost') {
    mailer = new Mailer(
      sparkPostTransport({
        sparkPostApiKey: nconf.get('SPARKPOST_API_KEY')
      })
    );
  } else if (mailService === 'sendgrid') {
    const sgMail = require("@sendgrid/mail");
    
    // Validate API key exists
    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }
    
    sgMail.setApiKey(sendgridApiKey);

    // Create a custom mailer object for SendGrid
    mailer = {
      render: Mailer.prototype.render,
      renderFromString: Mailer.prototype.renderFromString,
      
      send: async ({ to, from, subject, html }) => {
        try {
          return await sgMail.send({
            to,
            from,
            subject,
            html
          });
        } catch (error) {
          // Log error without exposing API key
          console.error('SendGrid send error:', {
            message: error.message,
            code: error.code,
            to: to,
            subject: subject,
            statusCode: error.response?.statusCode
          });
          throw error;
        }
      },
      
      sendMail: async (template, email, options) => {
        try {
          const user = await DB.User.findOne({ email });
          if (!user || (user && user.notificationSettings)) {
            const configs = await DB.Config.find({
              public: true,
              key: {
                $in: ['facebookLink', 'twitterLink', 'instagramLink', 'siteLogo', 'siteName', 'currencySymbol']
              }
            }).exec();
            
            const data = {};
            configs.forEach(item => {
              data[item.key] = item.value;
            });
            
            const newOptions = Object.assign(options, {
              appConfig: {
                baseUrl: nconf.get('baseUrl'),
                userWebUrl: nconf.get('userWebUrl'),
                adminWebUrl: nconf.get('adminWebUrl'),
                logoUrl: data.siteLogo || nconf.get('logoUrl'),
                siteName: data.siteName || nconf.get('SITE_NAME'),
                facebookUrl: data.facebookLink || nconf.get('facebookUrl'),
                twitterUrl: data.twitterLink || nconf.get('twitterUrl'),
                instagramUrl: data.instagramLink || nconf.get('instagramUrl') || '',
                currencySymbol: data.currencySymbol || '$'
              }
            });
            
            const emailTemplate = await DB.EmailTemplate.findOne({
              key: template
            });
            
            if (emailTemplate && emailTemplate.content) {
              const body = swig.render(emailTemplate.content, {
                locals: newOptions || {}
              });
              const output = mailer.render(emailTemplate.path, newOptions, body);
              
              let subject = emailTemplate.subject || options.subject;
              if (emailTemplate.subject_replace_fields && 
                  emailTemplate.subject_replace_fields.length > 0 && 
                  options.subject_replace_fields) {
                const replaceKeys = Object.keys(options.subject_replace_fields);
                if (replaceKeys && replaceKeys.length > 0) {
                  for (const key of replaceKeys) {
                    subject = subject.replace(`#${key}`, options.subject_replace_fields[key]);
                  }
                }
              }
              
              return await mailer.send({
                to: email,
                from: options.from || mailFrom,
                subject: subject,
                html: output
              });
            } else {
              console.error('No email template found for:', template);
            }
          }
          return true;
        } catch (e) {
          throw e;
        }
      }
    };
  } else if (mailService === 'ses' || mailService === 'aws_ses') {
    // AWS SES mailer (From must be a verified identity in SES - never use mailFrom)
    const sesRegion = nconf.get('Region') || nconf.get('AWS_REGION');
    const sesAccessKeyId = nconf.get('Access_Key_ID') || nconf.get('AWS_ACCESS_KEY_ID');
    const sesSecretAccessKey = nconf.get('Secret_Access_Key') || nconf.get('AWS_SECRET_ACCESS_KEY');
    const sesFromEmail =
      (process.env.From_Email || process.env.from_email || nconf.get('From_Email') || nconf.get('from_email') || '')
        .trim() || 'noreply@expertbridge.online';

    if (!sesRegion || !sesAccessKeyId || !sesSecretAccessKey) {
      throw new Error('AWS SES is not configured: set Region, Access_Key_ID, and Secret_Access_Key in .env');
    }

    const ses = new AWS.SES({
      region: sesRegion,
      accessKeyId: sesAccessKeyId,
      secretAccessKey: sesSecretAccessKey
    });

    console.log('SES mailer: sending From =', sesFromEmail);

    mailer = {
      render: Mailer.prototype.render,
      renderFromString: Mailer.prototype.renderFromString,

      send: async ({ to, from, subject, html }) => {
        try {
          const toAddresses = Array.isArray(to) ? to : [to];
          const source = (from && from.trim()) ? from.trim() : sesFromEmail;
          return await ses.sendEmail({
            Source: source,
            Destination: { ToAddresses: toAddresses },
            Message: {
              Subject: { Data: subject, Charset: 'UTF-8' },
              Body: {
                Html: { Data: html, Charset: 'UTF-8' }
              }
            }
          }).promise();
        } catch (error) {
          console.error('AWS SES send error:', {
            message: error.message,
            code: error.code,
            to: to,
            subject: subject
          });
          // In sandbox, SES rejects unverified recipient (To) or sender (From)
          if (error.code === 'MessageRejected' && /not verified/i.test(error.message)) {
            const err = new Error('Email address is not verified in AWS SES. In sandbox mode, verify the recipient in SES Console or request production access.');
            err.code = 'ERR_SES_IDENTITY_NOT_VERIFIED';
            throw err;
          }
          throw error;
        }
      },

      sendMail: async (template, email, options) => {
        try {
          const user = await DB.User.findOne({ email });
          if (!user || (user && user.notificationSettings)) {
            const configs = await DB.Config.find({
              public: true,
              key: {
                $in: ['facebookLink', 'twitterLink', 'instagramLink', 'siteLogo', 'siteName', 'currencySymbol']
              }
            }).exec();

            const data = {};
            configs.forEach(item => {
              data[item.key] = item.value;
            });

            const newOptions = Object.assign(options, {
              appConfig: {
                baseUrl: nconf.get('baseUrl'),
                userWebUrl: nconf.get('userWebUrl'),
                adminWebUrl: nconf.get('adminWebUrl'),
                logoUrl: data.siteLogo || nconf.get('logoUrl'),
                siteName: data.siteName || nconf.get('SITE_NAME'),
                facebookUrl: data.facebookLink || nconf.get('facebookUrl'),
                twitterUrl: data.twitterLink || nconf.get('twitterUrl'),
                instagramUrl: data.instagramLink || nconf.get('instagramUrl') || '',
                currencySymbol: data.currencySymbol || '$'
              }
            });

            const emailTemplate = await DB.EmailTemplate.findOne({
              key: template
            });

            if (emailTemplate && emailTemplate.content) {
              const body = swig.render(emailTemplate.content, {
                locals: newOptions || {}
              });
              const output = mailer.render(emailTemplate.path, newOptions, body);

              let subject = emailTemplate.subject || options.subject;
              if (emailTemplate.subject_replace_fields &&
                  emailTemplate.subject_replace_fields.length > 0 &&
                  options.subject_replace_fields) {
                const replaceKeys = Object.keys(options.subject_replace_fields);
                if (replaceKeys && replaceKeys.length > 0) {
                  for (const key of replaceKeys) {
                    subject = subject.replace(`#${key}`, options.subject_replace_fields[key]);
                  }
                }
              }

              return await mailer.send({
                to: email,
                from: options.from || sesFromEmail,
                subject: subject,
                html: output
              });
            } else {
              console.error('No email template found for:', template);
            }
          }
          return true;
        } catch (e) {
          throw e;
        }
      }
    };
  } else {
    const smtp =
      smtpValue.value.type === 'service'
        ? {
            service: smtpValue.value.service.name,
            auth: {
              user: smtpValue.value.service.auth.user,
              pass: smtpValue.value.service.auth.pass
            }
          }
        : {
            host: smtpValue.value.custom.host,
            port: smtpValue.value.custom.port,
            secure: smtpValue.value.custom.secure,
            auth: {
              user: smtpValue.value.custom.auth.user,
              pass: smtpValue.value.custom.auth.pass
            }
          };
    mailer = new Mailer(smtp);
  }
}

emailQ.process(async (job, done) => {
  try {
    await init();
    await mailer.sendMail(job.data.template, job.data.emails, job.data.options);
    done();
  } catch (e) {
    // Log error without sensitive data
    console.error('Email queue processing error:', {
      message: e.message,
      code: e.code,
      template: job.data.template,
      recipient: job.data.emails
    });
    done(e);
  }
});
// Add raw send function (bypasses queue + template lookup)
async function sendRawNow(to, subject, html) {
  await init(); // ensures mailer is fully initialized

  // SES: always use From_Email (verified sender). Never use mailFrom for SES.
  const mailService = nconf.get('MAIL_SERVICE');
  const from =
    mailService === 'ses' || mailService === 'aws_ses'
      ? ((process.env.From_Email || process.env.from_email || nconf.get('From_Email') || nconf.get('from_email') || '')
          .trim() || 'noreply@expertbridge.online')
      : mailFrom;

  return mailer.send({
    to,
    from,
    subject,
    html
  });
}

module.exports = {
  send(template, emails, options) {
    emailQ.createJob({ template, emails, options }).save();
  },
   sendRawNow 
};