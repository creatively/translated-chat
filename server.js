const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const dotenv = require('dotenv')
const getRandomCharacters = require('./custom-modules/random-characters.js')
const translate = require('./custom-modules/translate.js')
const { getSupportedLanguagesObject , getLanguageDescriptionFromLanguageCode } = require('./custom-modules/languages.js')
const getLocationAndWeather = require('./custom-modules/getLocationAndWeather.js')

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
dotenv.config()

const c = txt => console.log(txt)
const ct = obj => console.table(obj)

const port = process.env.PORT || 8080
server.listen(port, () => {
  c(`server started on :${port}`)
})


// ------- HANDLE INCOMING REQUESTS -------

// USER GOES HERE IF NO ROOM NAME APPENDED TO URL
app.get('/', (req, res) => {
  newRoomName = getRandomCharacters(5)
  c(`>>> room :${newRoomName} created`)
  res.redirect('/'+ newRoomName)
})

// USER GOES HERE IF A ROOM NAME IS ALREADY APPENDED TO URL
app.get('/:room', (req, res) => {
  res.render('room', { 
    roomName: req.params.room,
    supportedLanguages: JSON.stringify(getSupportedLanguagesObject()),
    usersIp: req.headers['x-forwarded-for'] || req.socket.localAddress ,
  })
})


// ------- CHAT ROOM UTIL FUNCTIONS --------
const rooms = { }

function getUserRooms(usersConnection) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[usersConnection.id] != null) names.push(name)
    return names
  }, [])
}

function getRoomUsersArray(roomName, usersConnection) {
  let roomUsers = []

  for (var user in rooms[roomName]) {
      for (var id in rooms[roomName][user]) {
        const isThisUserTheSender = usersConnection.id === id
        var _user = {
          'id': id,
          'name': rooms[roomName][user][id].name,
          'language': rooms[roomName][user][id].language,
          'sender': isThisUserTheSender
        }
        roomUsers.push(_user)
      }
  }
  return roomUsers
}

const getRoomUsersNameAndLanguage = roomName => {
  let roomUsers = []
  
  for (var user in rooms[roomName]) {
    for (var id in rooms[roomName][user]) {
      const userDetail = rooms[roomName][user][id]
      var _user = {
        'name': userDetail.name,
        'language': getLanguageDescriptionFromLanguageCode(userDetail.language)
      }
      roomUsers.push(_user)
    }
  }
  return roomUsers
}

const addUserToRoom = (roomName, userObject) => {
  if (!rooms) rooms = {}
  if (!rooms[roomName]) rooms[roomName] = {}
  if (!rooms[roomName].users) rooms[roomName].users = {}
  rooms[roomName].users[userObject.id] = userObject
}


// ------- SOCKET HANDLING -------
io.on('connection', (usersConnection) => {

  // HANDLE A USER JOINING A ROOM
  usersConnection.on('new-user', (roomName, name, language, usersIp) => {
    usersConnection.join(roomName)
    addUserToRoom(roomName, {
      'id': usersConnection.id,
      'name': name,
      'language': language,
      'sender': false
    })

    const activeUsers = getRoomUsersNameAndLanguage(roomName)
    getLocationAndWeather(usersIp ,newUsersLocationAndWeather => {
      const newUserNameAndLanguage = {
        name: name,
        language: getLanguageDescriptionFromLanguageCode(language)
      }
      newUsersDetails = { ...newUserNameAndLanguage, ...newUsersLocationAndWeather}
      io.in(roomName).emit('user-connected', newUsersDetails, activeUsers)
    })
  })

  // HANDLE A USER DISCONNECTING
  usersConnection.on('disconnect', () => {
    getUserRooms(usersConnection).forEach(roomName => {
      const leaversName = rooms[roomName].users[usersConnection.id].name
        const noOfUsers = Object.keys(rooms[roomName].users).length
        if (noOfUsers > 1) {
          delete rooms[roomName].users[usersConnection.id]
          const latestActiveUsers = getRoomUsersNameAndLanguage(roomName)
          io.in(roomName).emit('user-disconnected', leaversName, latestActiveUsers)
        } else {
          delete rooms[roomName]
          c(`---- room :${roomName} closed <<<<`)
        }
    })
  })


  // ------- TRANSLATION HANDLING ------

  usersConnection.on('send-chat-message', (room, message) => {

    // CALLBACK WHEN TRANSLATIONS RECEIVED
    const callback_getTranslations = (translations, roomUsersArray, senderName) => {
      roomUsersArray.forEach(user => {
        emitMessage(user.id, senderName, translations[user.language])
      })
    }

    // 3 TYPES OF EMITTING MESSAGES OUT TO THE USER(s) 
    const emitMessage = (userId, senderName, message) => {
      io.to(userId).emit(
        'chat-message', {
          message: message, 
          name: senderName 
        }
      )
    }

    const emitInfoMessageByRoomOnlyUser = (roomName, message) => {
      io.in(roomName).emit(
        'info-message-only-user', {
          message: message
        }
      )
    }

    const emitUntranslatedMessage = (message, users, senderName) => {
      users.forEach(user => {
        emitMessage(user.id, senderName, message)
      })
    }

    // SEND MESSAGE FOR TRANSLATION, OR HANDLE OTHERWISE
    const roomUsersArray = getRoomUsersArray(room, usersConnection)

    const sendForTranslationWithCallback = (usersInfo, callback) => {
      translate(
        message, 
        usersInfo.fromLanguage, 
        usersInfo.targetLanguages, 
        usersInfo.roomUsersArrayExcludingSender, 
        usersInfo.senderName,
        callback
      )
    }

    class UsersInfo {
      constructor(room, roomUsersArray) {
        this.room = room
        this.roomUsersArray = roomUsersArray
        this.numberInRoom = roomUsersArray.length
        this.roomUsersArrayExcludingSender = this.roomUsersArray.filter(user => !user.sender)
        this.fromLanguage = this.roomUsersArray.filter(user => user.sender)[0].language
        this.senderName = this.roomUsersArray.filter(user => user.sender)[0].name
        this.roomUsersWithADifferentLanguage = this.roomUsersArray.filter(user => user.language !== this.fromLanguage)
        this.targetLanguages = Array.from(new Set(this.roomUsersWithADifferentLanguage.map(user => user.language)))
        this.translationNeeded = this.roomUsersWithADifferentLanguage.length > 0
      }
    }

    // 3 POTENTIAL SCENARIOS : 
    //    (1) USER IS ONLY USER, (2) USERS ALL HAVE ONE LANGUAGE, (3) USERS HAVE MULTIPLE LANGUAGES SO NEEDS TRANSLATION
    if (roomUsersArray.length >1) {
      const usersInfo = new UsersInfo(room, roomUsersArray)
      if (usersInfo.translationNeeded) {
        sendForTranslationWithCallback(usersInfo, callback_getTranslations)
      } else {
        emitUntranslatedMessage(message, usersInfo.roomUsersArrayExcludingSender, usersInfo.senderName)
      }
    } else {
      emitInfoMessageByRoomOnlyUser(room, `You're currently the only person in this chat`)
    }

  })
})
