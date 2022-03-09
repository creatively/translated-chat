module.exports = function getLocationAndWeather(callback) {

    var axios = require("axios").default
    let callbackData = {};

    // Utils
    const convertLocaltimeToHoursOnly = dateTime => {
        const length = dateTime.length
        const time = dateTime.substring(length - 5, length);
        return time.replace('.', ':').replace(' ','0')
    }

    // Get Location Data
    axios.request({url: 'https://ipwhois.app/json/'})
        .then(function (response) {
            const data = response.data;
            callbackData['city'] = data.city
            callbackData['country'] = data.country
            callbackData['countryFlag'] = data.country_flag
            callbackData['latitude'] = data.latitude
            callbackData['longitude'] = data.longitude
            callbackData['locationApiWorkedOK'] = true
        }).catch(() => {
            callbackData['locationApiWorkedOK'] = false
            callback(callbackData)
        }).then(function(){
            
            // Get Weather data
            const coordinates = `${callbackData['latitude']},${callbackData['longitude']}`
            axios.request({url: `https://api.weatherapi.com/v1/current.json?key=${process.env.KEY_API_WEATHERAPI}&q=${coordinates}`})
                .then(function (response) {
                    const data = response.data;
                    callbackData['temp'] = data.current.temp_c
                    callbackData['iconUrl'] = 'https:'+data.current.condition.icon
                    callbackData['localtime'] = convertLocaltimeToHoursOnly(data.location.localtime);
                    callbackData['weatherApiWorkedOK'] = true
                }).catch(function (e) {
                    console.error('>>>>> Weather API call failed <<<<');
                    callbackData['weatherApiWorkedOK'] = false
                }).then(() => {
                    callback(callbackData)
                })
        })
    }