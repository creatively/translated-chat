const e = require('express')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const getRandomCharacters = require('./custom-modules/random-characters.js')
const translate = require('./custom-modules/translate.js');


app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
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


// ------- INCOMING REQUESTS -------


// Goes here if no roomname in url
app.get('/', (req, res) => {
  c('--- /  1');
  newRoomName = getRandomCharacters(5);
  c(newRoomName);
  res.render('room', { roomName: newRoomName })   // room9 needed?
});

app.get('./public/cartoon-blue-background.png', (req, res) => {
  c('--- /  image');
  newRoomName = getRandomCharacters(5);
  c(newRoomName);
  res.render('room', { roomName: newRoomName })   // room9 needed?
});



// Goes straight here if a roomname in url
app.get('/:room', (req, res) => {
  c('--- /  2');
  c(req.params.room);
  res.render('room', { roomName: req.params.room })
});

// NEXT : 
// >> roomName is correctly getting written out into 'room' page variable
//    and links correctly to the room if put in url for new user
//    Need to show it in a copyable url and/or in the 'room' page url
// >>  Also need to test 2 X rooms + 2 X people


// ------- SOCKET HANDLING -------


const addUserToRoom = (roomName, userObject) => {
  if (!rooms) rooms = {};
  if (!rooms[roomName]) rooms[roomName] = {};
  if (!rooms[roomName].users) rooms[roomName].users = {};

  rooms[roomName].users[userObject.id] = userObject;
}


io.on('connection', usersConnection => {

  // New User
  usersConnection.on('new-user', (roomName, name, language) => {

    usersConnection.join(roomName);

    addUserToRoom(roomName, {
      'id': usersConnection.id,
      'name': name,
      'language': language,
      'sender': false
    });
      
    usersConnection.to(roomName).broadcast.emit('user-connected', name)
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

    // Utils
    const sendersId = usersConnection.id;

    const getRoomUsersArray = roomName => {
      let roomUsers = [];

      for (var user in rooms[roomName]) {
          for (var id in rooms[roomName][user]) {
            var _user = {
              'id': id,
              'name': rooms[room][user][id].name,
              'language': rooms[room][user][id].language,
              'sender': sendersId === id
            };
            roomUsers.push(_user);
          }
      }
      return roomUsers;
    }

    const callback_getTranslations = (translations, roomUsersArray, senderName) => {
ct(translations);
      roomUsersArray.forEach(user => {
        emitMessage(user.id, senderName, translations[user.language]);
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
      const sender = getRoomUsersArray(room).filter(user => user.sender);  // check that user.sender works ok here
      emitMessage(sender.id, user.name, message);
    }

    const emitUntranslatedMessages = (message, users, senderName) => {
      users.forEach(user => {
        emitMessage(user.id, user.name, message);   // need to sendersName
      })
    }

    const roomUsersArray = getRoomUsersArray(room);
    if (roomUsersArray.length > 0) {
      const roomUsersArrayExcludingSender = roomUsersArray.filter(user => !user.sender);
      const fromLanguage = roomUsersArray.filter(user => user.sender)[0].language;
      const senderName = roomUsersArray.filter(user => user.sender)[0].name;
      const toLanguages = Array.from([ ... new Set(roomUsersArrayExcludingSender.map(arr => arr['language'])) ]);
      const toLangaugesExcludingSendersLanguage = toLanguages.filter(language => !fromLanguage);
      const translationsNeeded = toLangaugesExcludingSendersLanguage.length > 0;
    
    //if (translationsNeeded) {
      translate(message, fromLanguage, toLanguages, callback_getTranslations, roomUsersArrayExcludingSender, senderName);
    }
    //} else {
    //  emitUntranslatedMessages(message, roomUsersArrayExcludingSender, senderName);
    //}


  })

})


