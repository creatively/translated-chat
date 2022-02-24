/*

This "translate" method/module interacts with a remote translation API
  it returns an array of translations, for the languages listed as "to" array parameter  eg. ...

    (message, from,   to,           callback,             roomUsersArrayExcludingSender)
    ('hi',    'en',   ['fr','de'],  myCallbackFunction,   objectToPassThroughInThisClosure)
  
    results in ....
      { 
        'fr' : 'Bonjour.',
        'de', 'Hallo. - Was ist los?'
      }
*/

var axios = require("axios").default;

module.exports = function translate(message, from, to, callback, roomUsersArrayExcludingSender) {

  var options = {
    method: 'POST',
    url: 'https://lecto-translation.p.rapidapi.com/v1/translate/text',
    headers: {
      'content-type': 'application/json',
      'x-rapidapi-host': 'lecto-translation.p.rapidapi.com',
      'x-rapidapi-key': 'd90847b963msh23659dd5bda7ddfp1b0daajsna48f79be363b'
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
      callback(translations, roomUsersArrayExcludingSender);
  }).catch(function (error) {
    console.error('--- translations failed ', error);
  });
}