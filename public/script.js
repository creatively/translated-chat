const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const c = txt => console.log(txt);


// if in room.ejs, ask for name, then broadcast :new-user joining 
if (messageForm != null) {
  const name = prompt('What is your name?')
  appendMessage('You joined')

  // announce new user
  socket.emit('new-user', roomName, name)

  // send chat message
  messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', roomName, message)
    messageInput.value = ''
  })
}

// receive message
socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

// connect/disconnect
socket.on('user-connected', name => {
  appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} disconnected`)
})

// print message
function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}