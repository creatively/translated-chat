module.exports = function translate(message, fromLanguage, targetLanguages, roomUsersArrayExcludingSender, senderName, callback) {
  const projectId = 'translated-chat';
  const { Translate } = require('@google-cloud/translate').v2;
  const translate = new Translate({projectId});
  let translations = {};
  translations[fromLanguage] = message;
  let numberOfTranslationsDone = 0;
  const numberOfTargetLanguages = targetLanguages.length;

  const addToCallback = translationResult => {
    const languageJustTranslated = targetLanguages[numberOfTranslationsDone]
    translations[languageJustTranslated] = translationResult
    numberOfTranslationsDone = Object.keys(translations).length - 1
    if (numberOfTranslationsDone === numberOfTargetLanguages) {
      callback(translations, roomUsersArrayExcludingSender, senderName)
    } else {
      const targetLanguage = targetLanguages[numberOfTranslationsDone]
      go(targetLanguage)
    }
  }

  async function go(targetLanguage) {
    const translationResult = await translate.translate(message, targetLanguage)
    addToCallback(translationResult[0])
  }

  go(targetLanguages[0])
}
