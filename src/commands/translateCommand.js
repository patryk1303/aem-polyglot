const dictionaryService = require('../dictionaryService');
const TranslateDictionaryService = require('../translate/TranslateDictionaryService');
const translationLog = require('../../src/translate/TranslationLog');
const TranslateServiceFactory = require('../factories/TranslationServiceFactory');

async function translateCommand (source, target, options) {
  const apiKey = process.env.API_KEY || options.apiKey;
  if (!apiKey) {
    console.log('Translation Service API key is not defined. If your service does not require API key, provide any text.');
    return;
  }
  try {
    console.log(`Translating '${source}' to ${target}`);
    const sourceDict = await dictionaryService.readDict(source);
    const targetDict = await dictionaryService.readDict(target);
    const CurrentTranslationService = TranslateServiceFactory(options.service);
    const translationService = new CurrentTranslationService(apiKey);
    const translateDictionaryService = new TranslateDictionaryService(translationService, {
      keys: options.keys,
      email: options.email || ''
    });

    let translatedDict = await translateDictionaryService.translate(sourceDict, targetDict);
    if (!options.disableSorting) {
      translatedDict = dictionaryService.sort(translatedDict);
    }
    if (!options.disableLogOutput) {
      translationLog.print();
    }
    await dictionaryService.saveDict(translatedDict, target);
  } catch (e) {
    console.log(e);
  }
}

module.exports = translateCommand;
