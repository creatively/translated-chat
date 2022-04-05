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



module.exports = function translate(message, from, targetLanguages, callback, roomUsersArrayExcludingSender, senderName) {
  const projectId = 'translated-chat';
  const {Translate} = require('@google-cloud/translate').v2;
  const translate = new Translate({projectId});
  let translations = {};
  let translationsReturnedSoFar = 0;
  const numberOfTargetLanguages = targetLanguages.length;

  const addToCallback = translationResult => {
c(translationResult)
    translations[targetLanguages[translationsReturnedSoFar]] = translationResult;
    const numberOfTranslationsDone = Object.keys(translations).length;
    if (numberOfTranslationsDone === numberOfTargetLanguages) {
      callback(translations, roomUsersArrayExcludingSender, senderName)
    } else {
      translationsReturnedSoFar++;
      go(targetLanguages[translationsReturnedSoFar])
    }
  }

  async function go(targetLanguage) {
    const translationResult = await translate.translate(message, targetLanguage);
    c(translationResult[1].data.translations)//[1].detectedSourceLanguage)
    c(translationResult[0])
    addToCallback(translationResult[0])
  }

  go(targetLanguages[0])
}
