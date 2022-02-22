const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

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

  usersConnection.on('new-user', (room, name) => {
    usersConnection.join(room)
console.log(usersConnection.id);
    rooms[room].users[usersConnection.id] = name
    usersConnection.to(room).broadcast.emit('user-connected', name)
  })

  usersConnection.on('send-chat-message', (room, message) => {
    usersConnection.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[usersConnection.id] })
  })

  usersConnection.on('disconnect', () => {
    getUserRooms(usersConnection).forEach(room => {
      usersConnection.to(room).broadcast.emit('user-disconnected', rooms[room].users[usersConnection.id])
      delete rooms[room].users[usersConnection.id]
    })
  })
})


