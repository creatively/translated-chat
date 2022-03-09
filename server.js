const e = require('express')
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
server.listen(3000)

const c = txt => console.log(txt);
const ct = obj => console.table(obj);


// ------- ROOMS INIT --------
const rooms = { }

function getUserRooms(usersConnection) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[usersConnection.id] != null) names.push(name)
    return names
  }, [])
}

function getRoomUsersArray(roomName, usersConnection) {
  let roomUsers = [];

  for (var user in rooms[roomName]) {
      for (var id in rooms[roomName][user]) {
        const isThisUserTheSender = usersConnection.id === id
        var _user = {
          'id': id,
          'name': rooms[roomName][user][id].name,
          'language': rooms[roomName][user][id].language,
          'sender': isThisUserTheSender
        };
        roomUsers.push(_user);
      }
  }
  return roomUsers;
}

const getRoomUsersNameAndLanguage = roomName => {
  let roomUsers = [];
  
  for (var user in rooms[roomName]) {
    for (var id in rooms[roomName][user]) {
      const userDetail = rooms[roomName][user][id];
      var _user = {
        'name': userDetail.name,
        'language': getLanguageDescriptionFromLanguageCode(userDetail.language)
      };
      roomUsers.push(_user);
    }
  }
  return roomUsers;
}


// ------- INCOMING REQUESTS -------

// Goes here if no roomname in url
app.get('/', (req, res) => {
  newRoomName = getRandomCharacters(5);
  c(`>>> room :${newRoomName} created`);
  res.redirect('/'+ newRoomName);
});

// Goes straight here if a roomname in url
app.get('/:room', (req, res) => {
  res.render('room', { 
    roomName: req.params.room,
    supportedLanguages: JSON.stringify(getSupportedLanguagesObject())
  })
});


// ------- SOCKET HANDLING -------

const addUserToRoom = (roomName, userObject) => {
  if (!rooms) rooms = {};
  if (!rooms[roomName]) rooms[roomName] = {};
  if (!rooms[roomName].users) rooms[roomName].users = {};

  rooms[roomName].users[userObject.id] = userObject;
}


io.on('connection', (usersConnection) => {

  // New User
  usersConnection.on('new-user', (roomName, name, language) => {
    usersConnection.join(roomName);
    addUserToRoom(roomName, {
      'id': usersConnection.id,
      'name': name,
      'language': language,
      'sender': false
    });

    const activeUsers = getRoomUsersNameAndLanguage(roomName);
    
    getLocationAndWeather(newUsersLocationAndWeather => {
      const newUserNameAndLanguage = {
        name: name,
        language: getLanguageDescriptionFromLanguageCode(language)
      }
      newUsersDetails = { ...newUserNameAndLanguage, ...newUsersLocationAndWeather}
      io.in(roomName).emit('user-connected', newUsersDetails, activeUsers)
    })
  })

  // Disconnect
  usersConnection.on('disconnect', () => {
    getUserRooms(usersConnection).forEach(roomName => {
      const leaversName = rooms[roomName].users[usersConnection.id].name;
        const noOfUsers = Object.keys(rooms[roomName].users).length
        if (noOfUsers > 1) {
          delete rooms[roomName].users[usersConnection.id]
          const latestActiveUsers = getRoomUsersNameAndLanguage(roomName);
          io.in(roomName).emit('user-disconnected', leaversName, latestActiveUsers)
        } else {
          delete rooms[roomName]
          c(`---- room :${roomName} closed <<<<`);
        }
    })
  })

  // Translate & Emit message
  usersConnection.on('send-chat-message', (room, message) => {

    const callback_getTranslations = (translations, roomUsersArray, senderName) => {
      roomUsersArray.forEach(user => {
        emitMessage(user.id, senderName, translations[user.language]);
      });
    }

    const roomUsersArray = getRoomUsersArray(room, usersConnection);
    const numberInRoom = roomUsersArray.length;

    const emitMessage = (userId, senderName, message) => {
      io.to(userId).emit(
        'chat-message', {
          message: message, 
          name: senderName 
        }
      )
    }

    const emitInfoMessageByUserId = (userId, message) => {
      io.to(userId).emit(
        'info-message', {
          message: message
        }
      )
    }

    const emitInfoMessageByRoom = (roomName, message) => {
      io.in(roomName).emit(
        'info-message', {
          message: message
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
        emitMessage(user.id, senderName, message);
      })
    }

    // Main 'send-chat-message' Code
    if (numberInRoom > 1) {
      const roomUsersArrayExcludingSender = roomUsersArray.filter(user => !user.sender);
      const fromLanguage = roomUsersArray.filter(user => user.sender)[0].language;
      const senderName = roomUsersArray.filter(user => user.sender)[0].name;
      const toLanguages = Array.from([ ... new Set(roomUsersArrayExcludingSender.map(arr => arr['language'])) ]);
      const toLangaugesExcludingSendersLanguage = toLanguages.filter(language => fromLanguage);
      const translationsNeeded = toLangaugesExcludingSendersLanguage.length > 0;
      if (translationsNeeded) {
        translate(message, fromLanguage, toLanguages, callback_getTranslations, roomUsersArrayExcludingSender, senderName);
      } else {
        emitUntranslatedMessage(message, roomUsersArrayExcludingSender, senderName);
      }
    } else {
      emitInfoMessageByRoomOnlyUser(room, `You're currently the only person in this chat`)
    }
  })

})
