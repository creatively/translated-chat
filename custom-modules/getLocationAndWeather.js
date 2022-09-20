module.exports = function getLocationAndWeather(usersIp, callback) {

    var axios = require("axios").default
    let callbackData = {};

    // Utils
    const convertLocaltimeToHoursOnly = dateTime => {
        const length = dateTime.length
        const time = dateTime.substring(length - 5, length);
        return time.replace('.', ':').replace(' ','0')
    }

    // Get Location Data
    const urlApiLocationData = `https://ipwhois.app/json/${usersIp}`

    axios.request({url: urlApiLocationData})
        .then(function (response) {
            const data = response.data;
            if (response.status !== 200) 
                throw Error(`--- API IpWhoIs Server call - unable to get a valid response, code=${response.status}`)
            if (!data.success)
                throw Error(`--- API IpWhoIs Server call - returned an error message, message="${data.message}"`)

            callbackData['city'] = data.city
            callbackData['country'] = data.country
            callbackData['countryFlag'] = data.country_flag
            callbackData['locationApiWorkedOK'] = true
        }).catch((e) => {
            console.log(`ERROR calling : ${urlApiLocationData}`)
            console.log(e)
            callbackData['locationApiWorkedOK'] = false
        }).finally(function(){
            callback(callbackData)
        })
    }