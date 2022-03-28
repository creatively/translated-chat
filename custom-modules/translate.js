/*

This "translate" method/module interacts with a remote translation API
  it returns an array of translations, for the (up to 3) languages listed as "to" array parameter  eg. ...

    (message, from,   to (max 3),   callback,             roomUsersArrayExcludingSender)
    ('hi',    'en',   ['fr','de'],  myCallbackFunction,   objectToPassThroughInThisClosure)
  
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

const c = txt => console.log(txt)

var axios = require("axios").default;

module.exports = function translate(message, from, to, callback, roomUsersArrayExcludingSender, senderName, provider) {

  if (provider && provider === 'google') {

    const projectId = 'translated-chat';
    const {Translate} = require('@google-cloud/translate').v2;
    const translate = new Translate({projectId});
console.log('---- goggle');
    (async () => {
      let [_translations] = await translate.translate(message, to[0]);
      _translations = Array.isArray(_translations) ? _translations : [_translations];

      let translations = {};
      let languageIndex = 0;
      _translations.forEach(translation => {
        const language = to[languageIndex];
        translations[language] = translation;
        languageIndex++;
      });

      callback(translations, roomUsersArrayExcludingSender, senderName)
    })()

  } else {  // use lecto translate
    
    var options = {
      method: 'POST',

      url: 'https://api.lecto.ai/v1/translate/text',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': `${process.env.KEY_API_TRANSLATIONS_LECTO}`
      },
      data: {
        texts: [message],
        from: from,
        to: to
      }
    };

    axios.request(options)
      .then(function (response) {
        let translations = {};
        let languageIndex = 0;
        response.data.translations.forEach(translation => {
          const language = to[languageIndex];
          translations[language] = translation.translated[0];
          languageIndex++;
        });
        callback(translations, roomUsersArrayExcludingSender, senderName);
    }).catch(function (error) {
      console.error('>>>>> translations failed for ... <<<<\n', error);
      console.log(error.response.config.data+'\n');
    });

  }
}