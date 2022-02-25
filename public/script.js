const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const c = txt => console.log(txt);


const handleModalSubmit = e => {
  e.preventDefault();
  const name = document.querySelector('#input-name').value;
  const language = document.querySelector('#select-language').value;
  document.querySelector('.modal-background').style.display = 'none';
  joinNewUser(name, language);
}

document.querySelector('.name-and-language-form').addEventListener('submit', handleModalSubmit);


function joinNewUser(name, language) {
c(name);
c(language);
  // announce new user
  socket.emit('new-user', roomName, name)

  // send chat message
  document.getElementById('send-container').addEventListener('submit', e => {
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