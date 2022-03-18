const socket = io()
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
  document.querySelector('.card').style.display = 'none';
  document.getElementById('message-input').focus();
  
  joinNewUser(name, language);
}

const getHTMLForNewUserAnnouncement = newUserDetails => {
  const nameAndLanguageHTML = 
    `<i class="person-name">${newUserDetails.name}</i> just connected in ${newUserDetails.language}`

  const locationHTML = (newUserDetails.locationApiWorkedOK) ?
    ` from 
       <img class="icon-flag" src="${newUserDetails.countryFlag}" height="15" width="20" />
      ${newUserDetails.country}` : ``

  const weatherHTML = (newUserDetails.weatherApiWorkedOK) ?
     ` where it's now
      ${newUserDetails.localtime} and
      <img class="icon-weather" src="${newUserDetails.iconUrl}" />
      ${newUserDetails.temp}'C
       in ${newUserDetails.city}` : ``

  return nameAndLanguageHTML + locationHTML + weatherHTML
}

const getHTMLForCurrentsUsersOnline = activeUsers => {
  let html = `<div class="text-subinfo">`
    activeUsers.forEach(user => {
      html += `<span>${user.name}</span>`
    })
  html += `</div>`

  return html
}

const nameAndLanguageForm = document.querySelector('.name-and-language-form') || null;
nameAndLanguageForm ? nameAndLanguageForm.addEventListener('submit', handleModalSubmit) : null;

function setUpLogOfOnlineOffline() {
  window.addEventListener('offline', function(e) { console.log('--- offline'); });
  window.addEventListener('online', function(e) { console.log('--- online'); });
  // also note that setting an image src can delay leaving the page
  // the server could then know if the user really had gone elsewhere or
  // if just the connection has gone. 
  // NB. Socket.io may handle this under the hood, but worth a look
  // NB2. navigator.sendBeacon also available for a potentially relevant situation
}
setUpLogOfOnlineOffline()


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
  appendMessage({
    textInfo: 
      `${data.message}, - send this url to invite others<br>
      ${location.host + location.pathname}`
  })
})

socket.on('user-connected', (newUserDetails, activeUsers) => {
  appendMessage({
    textInfo: getHTMLForNewUserAnnouncement(newUserDetails)
  })
  appendActiveUsers(activeUsers)
})

socket.on('user-disconnected', (name, activeUsers) => {
console.log(':user-disconnected');
console.table(activeUsers);
  appendMessage({
    textInfo: `${name} disconnected`
  })
  appendActiveUsers(activeUsers)
})

// Initialise starting form
const populateLanguagesList = () => {
  const dropdownSelectLanguage = document.getElementById('select-language')
  for (languageCode in supportedLanguages) {
    let newOption = new Option(supportedLanguages[languageCode], languageCode);
    dropdownSelectLanguage.add(newOption, undefined);
  }
}

document.body.onload = () => {
  populateLanguagesList()
  document.getElementById('select-language').value = navigator.language.substring(0,2)
  document.getElementById('input-name').focus()
}

function copyToClipboard(selectorOfInput) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    var copyText = document.querySelector(selectorOfInput);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
  }
}

// Display message in the messages container
function appendMessage(textObject) {

  // 'textObject' can contain properties including [textBubble, textName, textInfo, textSubInfo]
  // they determine how their text values are to be displayed
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
      // "type" indicates who the message has come from: [me, other, info]
      if (obj.textBubble && obj.textName) {
        obj['type'] = 'other'
      } else if (obj.textBubble) {
        obj['type'] = 'me'
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

  function appendActiveUsers(activeUsers) {
    const activeUsersElement = document.createElement('div')
    activeUsersElement.innerHTML = getHTMLForCurrentsUsersOnline(activeUsers)
    messageContainer.append(activeUsersElement)
  }
