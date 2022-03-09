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

var axios = require("axios").default;

module.exports = function translate(message, from, to, callback, roomUsersArrayExcludingSender, senderName) {

  var options = {
    method: 'POST',

    url: 'https://api.lecto.ai/v1/translate/text',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': process.env.KEY_API_TRANSLATIONS_LECTO
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