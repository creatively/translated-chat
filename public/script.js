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

const nameAndLanguageForm = document.querySelector('.name-and-language-form') || null;
nameAndLanguageForm ? nameAndLanguageForm.addEventListener('submit', handleModalSubmit) : null;


function joinNewUser(name, language) {
c(name);
c(language);
  // announce new user
  socket.emit('new-user', roomName, name, language);

  // send chat message
  document.getElementById('send-container').addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`me`, ``, `${message}`)
    socket.emit('send-chat-message', roomName, message)
    messageInput.value = ''
  })
}

// receive message
socket.on('chat-message', data => {
  appendMessage(`other`, `${data.name}`, `${data.message}`)
})

// connect/disconnect
socket.on('user-connected', name => {
  appendMessage(`other`, `${name} connected`, ``)
})

socket.on('user-disconnected', name => {
  appendMessage(`other`, `${name} disconnected`, ``)
})

// print message
function appendMessage(type, smalltext, bigtext) {
  const messageElement = document.createElement('div')
  messageElement.setAttribute('class', type)
  const html = bigtext ? 
    `<div class='largetext'><span>${bigtext}</span></div><div class='smalltext'>${smalltext}</div>` :
    `<div class='smalltext'>${smalltext}</div>`
  messageElement.innerHTML = html
  messageContainer.append(messageElement)
}
