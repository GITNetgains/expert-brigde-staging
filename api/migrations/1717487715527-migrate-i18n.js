'use strict';
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const langs = ['en', 'es'];

module.exports.up = async function (next) {
  await DB.I18nLanguage.remove();
  await DB.I18nText.remove();
  await DB.I18nTranslation.remove();

  await DB.I18nLanguage.create({
    key: 'en',
    name: 'EN',
    isDefault: true,
    isActive: true,
    flag: process.env.baseUrl + 'flags/us.svg'
  });

  // add text from en.json file to i18n text
  // then get translation
  const enFile = join(__dirname, '../server/migrations/translation', 'en.json');
  const enSourceData = readFileSync(enFile, { encoding: 'utf-8' });
  const jsonData = JSON.parse(enSourceData);
  const keys = Object.keys(jsonData);
  const textMapping = {};
  for (const key of keys) {
    const i18nText = new DB.I18nText({
      text: key
    });
    await i18nText.save();
    textMapping[key] = i18nText;
  }

  for (const lang of langs) {
    const targetFile = join(__dirname, '../server/migrations/translation', `${lang}.json`);
    if (existsSync(targetFile)) {
      const targetData = readFileSync(targetFile, { encoding: 'utf-8' });
      const targetJson = JSON.parse(targetData);
      const targetKeys = Object.keys(targetJson);
      for (const targetKey of targetKeys) {
        const i18Translation = new DB.I18nTranslation({
          lang,
          textId: textMapping[targetKey] ? textMapping[targetKey]._id : null,
          text: targetKey,
          translation: targetJson[targetKey]
        });

        await i18Translation.save();
      }
    }
  }

  console.log('Mirgate i18n success');
  next();
};

module.exports.down = function (next) {
  next();
};
