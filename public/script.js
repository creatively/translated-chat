const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const messageInput = document.getElementById('message-input')

const c = txt => console.log(txt);
const ct = obj => console.table(obj);


// Name & Language Modal Form
const handleModalSubmit = e => {
  e.preventDefault();
  const name = document.querySelector('#input-name').value;
  const language = document.querySelector('#select-language').value;
  document.querySelector('.modal-background').style.display = 'none';
  joinNewUser(name, language);
}

const getHTMLForNewUserAnnouncement = newUserDetails => {
  const nameAndLanguageHTML = 
    `${newUserDetails.name} just connected in ${newUserDetails.language}`

  const locationHTML = (newUserDetails.locationApiWorkedOK) ?
    ` from 
       <img class="icon-flag" src="${newUserDetails.countryFlag}" height="15" width="20" />
      ${newUserDetails.country}` : ``

  const weatherHTML = (newUserDetails.weatherApiWorkedOK) ?
     ` where it's now
      <img class="icon-weather" src="${newUserDetails.iconUrl}" />
      ${newUserDetails.temp}c
       in ${newUserDetails.city}` : ``

  return nameAndLanguageHTML + locationHTML + weatherHTML
}

const updateActiveUsersDisplay = activeUsers => {
  console.table(activeUsers)
}

const nameAndLanguageForm = document.querySelector('.name-and-language-form') || null;
nameAndLanguageForm ? nameAndLanguageForm.addEventListener('submit', handleModalSubmit) : null;


// Socket handling
function joinNewUser(name, language) {

  // announce new user
  socket.emit('new-user', roomName, name, language);

  // send chat message
  document.getElementById('send-container').addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage({
      textBubble: message
    })
    socket.emit('send-chat-message', roomName, message)
    messageInput.value = ''
  })
}

// receive chat message
socket.on('chat-message', data => {
  appendMessage({
    textBubble: data.message,
    textName: data.name
  });
})

// receive info message
socket.on('info-message', data => {
  appendMessage({
    textInfo: data.message
  })
})

socket.on('info-message-only-user', data => {
  console.table(data);
  appendMessage({
    textInfo: 
      `${data.message}, so send this url<br>
      <span class='url'>${location.href}</span><br>
      to invite others`
  })
})


// other user connected/disconnected
socket.on('user-connected', (newUserDetails, activeUsers) => {

  updateActiveUsersDisplay(activeUsers)

  appendMessage({
    textInfo: 
    getHTMLForNewUserAnnouncement(newUserDetails)
  })
})

socket.on('user-disconnected', (name, activeUsers) => {

  updateActiveUsersDisplay(activeUsers)
  // activeUserNames = activeUsers.map(users => users.name)
  appendMessage({
    textInfo: `${name} disconnected<br/>${html}`
  })
})


// print messages
function appendMessage(textObject) {
  /*  NB. textObject can contain either 1 or 2 properties 
  {
    textBubble: '' &&||
    textName: '' ||
    textInfo
  }
  */

  const obj = getTextObjectWithTextTypeAdded(textObject)
  const messageElement = document.createElement('div')
  messageElement.setAttribute('class', obj.type)
  messageElement.innerHTML = getMessageInnerHTML(obj)
  messageContainer.append(messageElement)
}

  function getMessageInnerHTML(textObject) {
    let html = ''
    const obj = getTextObjectWithTextTypeAdded(textObject)

    if (obj.textBubble) html += getMessagePartInnerHTML(obj.type, 'text-bubble', obj.textBubble)
    if (obj.textName) html += getMessagePartInnerHTML(obj.type, 'text-name', obj.textName)
    if (obj.textInfo) html += getMessagePartInnerHTML(obj.type, 'text-info', obj.textInfo)

    return html
  }

    function getTextObjectWithTextTypeAdded(obj) { 
      if (obj.textBubble && obj.textName) {
        obj['type'] = 'other'
      } else if (obj.textBubble) {
        obj['type'] = 'me'
        c(obj.type);
      } else {
        obj['type'] = 'info'
      }
      return obj
    }

      function getMessagePartInnerHTML(messageType, classType, text) {
        return `<div class='${messageType}'>
                  <div class='${classType}'>
                    <span>${text}</span>
                  </div>
                </div>`
      }


