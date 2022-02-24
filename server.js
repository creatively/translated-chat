const e = require('express')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const randomCharacters = require('./custom-modules/random-characters.js')
const translate = require('./custom-modules/translate.js');


app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
server.listen(3000)

const c = txt => console.log(txt);


// ------- ROOMS INIT --------

const rooms = { }

function getUserRooms(usersConnection) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[usersConnection.id] != null) names.push(name)
    return names
  }, [])
}


// ------- INCOMING REQUESTS -------

// all requests
app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})


// requested from homepage to create new room
app.post('/room', (req, res) => {

  // if a known room is requested to "/room", then stay where you are
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }

  // set up an empty room with 0 users and redirect to  "../roomname" 
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)
})


// page requests
app.get('/:room', (req, res) => {

  // send user to HOMEPAGE if just  localhost:3000/
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }

  // send user to named-ROOM - either creating a new room, or joining an existing room
  res.render('room', { roomName: req.params.room })
})



// ------- SOCKET HANDLING -------

io.on('connection', usersConnection => {

  // New User
  usersConnection.on('new-user', (room, name) => {
    usersConnection.join(room)
    rooms[room].users[usersConnection.id] = name
    usersConnection.to(room).broadcast.emit('user-connected', name)
  })

  // Disconnect
  usersConnection.on('disconnect', () => {
    getUserRooms(usersConnection).forEach(room => {
      usersConnection.to(room).broadcast
        .emit(
          'user-disconnected', 
          rooms[room].users[usersConnection.id]
        )
      delete rooms[room].users[usersConnection.id]
    })
  })

  // Translate & Emit message
  usersConnection.on('send-chat-message', (room, message) => {

    console.log('received chat message form client --> server');
    // Utils
    const sendersId = usersConnection.id;

    const getRoomUsersArray = roomName => {
      c(roomName);
      let roomUsers = [];
      for (var user in rooms[roomName]) {
          for (var id in rooms[roomName][user]) {
            var _user = {
              'id': id,
              'name': rooms[room][user][id],
              'language': 'en',
              'sender': sendersId === id
            };
            roomUsers.push(_user);
          }
      }
      return roomUsers;
    }

    const callback_getTranslations = (translations, roomUsersArray) => {
console.log(translations);
      const senderName = '-senderName-';
      roomUsersArray.forEach(user => {
        //emitMessage(user.id, senderName, translations[user.language])
      });
    }

    const emitMessage = (userId, senderName, message) => {
      io.to(userId).emit(
        'chat-message', {
          message: message, 
          name: senderName 
        }
      )
    }

    const emitErrorMessageToSender = (message, room) => {
      const sender = getRoomUsersArray(room).filter(user => user.sender);
      emitMessage(sender.id, user.name, message);
    }

    const emitUntranslatedMessages = (message, users) => {
      users.forEach(user => {
        console.log('emitUntranslatedMessages = '+ user.name);
          emitMessage(user.id, user.name, message);
      })
    }

    const roomUsersArray = getRoomUsersArray(room);
    const roomUsersArrayExcludingSender = roomUsersArray.filter(user => !user.sender);
    const fromLanguage = roomUsersArray.filter(user => user.sender)[0].language;
    const toLanguages = Array.from([ ... new Set(roomUsersArrayExcludingSender.map(arr => arr['language'])) ]);
    const toLangaugesExcludingSendersLanguage = toLanguages.filter(language => !fromLanguage);
    const translationsNeeded = toLangaugesExcludingSendersLanguage.length > 0;
    

    //if (translationsNeeded) {
      translate(message, 'en', ['fr','de'], callback_getTranslations, roomUsersArrayExcludingSender)
    //} else {
    //  emitUntranslatedMessages(message, roomUsersArrayExcludingSender);
    //}


  })


  // ------ TRANSLATION HANDLING -------

  // translate(text, from, to, callback);

/*



  const getTranslations = (text, roomName, senderUserId) => {
    const fromLanguage = rooms[roomName].users[senderUserId].language;
    const toLanguages = getCurrentLanguages(roomName);
    translate(text, fromLanguage, toLanguages, callback, callbackDetails);
  }

    const getArrayOfUniquePropertiesFromArrayOfObjects = (arr, property) => {
      return Array.from([ ... new Set(arr.map(arr => arr[property])) ]);
    }
  
      const getCurrentLanguages = (roomName) => {
        const users = rooms[roomName].users;
        return getArrayOfUniquePropertiesFromArrayOfObjects(users, 'language');
      }

    const translationNeeded = getCurrentLanguages.length > 1;



  const callback_getTranslations = (arrTranslations, roomName) => {
    // NB. arrTranslations = [{'fr': 'bonjour'}, {'es': 'hola'}]
    arrTranslations.push({fromLanguage: fromMessage});
    emitTranslatedMessages(arrTranslations, room);
  }



  const emitTranslatedMessages = (arrTranslations, roomName) => {
    rooms[roomName].users.forEach(user => {
      const userLangauge = user.langauge;
      const message = arrTranslations.get(userLangauge);
      const senderName = ?;
      const userId = user

      emitMessage(userId, senderName, message)


      io.to(user).broadcast
        .emit(
          'chat-message', {
            message: arrTranslations[0]['fr'],    // hardcoded to 0 & fr - needs a Set instead of Array to get translated message from arrTransaltions
            name: 'hardcoded name'
          }
        )
      });
  }

*/



})


