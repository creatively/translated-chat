/*

This "translate" method/module interacts with a remote translation API

    results in ....
      { 
        'fr' : 'Bonjour.',
        'de', 'Hallo. - Was ist los?'
      }
*/


/* 
GOOGLE QUOTA LIMITS HIT :
Google Translate 403 errors. 
  inc. '...Daily Limit Exceeded...' - exceeded a daily quota
  inc. '...User Rate Limit Exceeded...' - per minute quota.
*/
// process.env.GOOGLE_API_KEY

// Service Account Name = 'translated-chat'
// Service Account Id = 'translated-chat-630'
const c = txt => console.log(txt);
const ct = txt => console.table(txt);



module.exports = function translate(message, fromLanguage, targetLanguages, callback, roomUsersArrayExcludingSender, senderName) {
  const projectId = 'translated-chat';
  const {Translate} = require('@google-cloud/translate').v2;
  const translate = new Translate({projectId});
  let translations = {};
  translations[fromLanguage] = message;
  let numberOfTranslationsDone = 0;
  const numberOfTargetLanguages = targetLanguages.length;

  const addToCallback = translationResult => {
c(translationResult)
    const languageJustTranslated = targetLanguages[numberOfTranslationsDone]
    translations[languageJustTranslated] = translationResult
    numberOfTranslationsDone = Object.keys(translations).length - 1
    if (numberOfTranslationsDone === numberOfTargetLanguages) {
      callback(translations, roomUsersArrayExcludingSender, senderName)
    } else {
      const targetLanguage = targetLanguages[translationsAddedSoFar]
      go(targetLanguage)
    }
  }

  async function go(targetLanguage) {
    const translationResult = await translate.translate(message, targetLanguage)
    addToCallback(translationResult[0])
  }

  go(targetLanguages[0])
}
