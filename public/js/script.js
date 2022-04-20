const thisDomain = `//${location.host}`
const socket = io(thisDomain, {
  transports: [ "websocket" ] // disables long-polling
});
const messageContainer = document.getElementById('message-container')
const messageInput = document.getElementById('message-input')

// UTIL FUNCTIONS
const c = txt => console.log(txt);
const ct = obj => console.table(obj);
const add = text => setTimeout(() => {messageContainer.innerHTML = messageContainer.innerHTML + `<i>${text}</i><br>`}, 500)
const isCssSupported = property => property in document.body.style

const shiftDownMessageContainerViewport = () => {
  const messageContainerTotalHeight = document.getElementById('message-container').clientHeight
  window.scrollTo(0, messageContainerTotalHeight)
}

// SET UP FUNCTIONS
window.addEventListener('resize', shiftDownMessageContainerViewport)
document.getElementById('send-button').addEventListener('click', shiftDownMessageContainerViewport)


      // NB. On iOS, "window.resize" & possily "window.innerHeight" is affected by :
      //    - url bar show
      //    - portarit/landscape
      //    but not keyboard show (possibly just not triggering window.resize)

/*
  if (navigator.onLine) {   // true/false
  window.addEventListener('online', function(e) {
  window.addEventListener('offline', function(e) {


  document.addEventListener("visibilitychange", (event) => {
    if (document.visibilityState == "visible") {


  window.addEventListener('beforeunload', function (e) {
      e.preventDefault();
      e.returnValue = '';
  });



*/

/*
OBJECT FOR CONNECTION HANDLING
socket.emit('user-status-change', roomName, status)
  statuses = [[ back-online , tab-switched-back , tab-closing ]]


SERVER.JS
  usersConnection.on('disconnect', () => {
    getUserRooms(usersConnection).forEach(roomName => {
      const leaversName = rooms[roomName].users[usersConnection.id].name
      ... io.in(roomName).emit('user-disconnected', leaversName, latestActiveUsers)
      ----





*/


// Name & Language Inout Form
const handleModalSubmit = e => {
  e.preventDefault();
  const name = document.querySelector('#input-name').value;
  const language = document.querySelector('#select-language').value;
  document.querySelector('.card').style.display = 'none';
  document.getElementById('send-container').style.display = 'block';
  
  joinNewUser(name, language);
}

var menuIcon = document.querySelector('.icon-menu')
var menuTitles = document.querySelector('.menu-titles')
var headingAbout = document.querySelector('.about')
var headingPrivacyPolicy = document.querySelector('.privacy')
var headingCarbonUsage = document.querySelector('.carbon')
var overlay = document.getElementById('overlay')
menuIcon.addEventListener('click', toggleMenu)
headingAbout.addEventListener('click', toggleMenuItem)
headingPrivacyPolicy.addEventListener('click', toggleMenuItem)
headingCarbonUsage.addEventListener('click', toggleMenuItem)

document.body.classList.add('bg')
document.querySelectorAll('.icon-copy').forEach(icon => icon.addEventListener('click', copyToClipboard))

function toggleMenu() {
    if (menuTitles.classList.contains('open')) {
      menuTitles.classList.remove('open')
      overlay.classList.remove('on')
    } else {
      menuTitles.classList.add('open')
      overlay.classList.add('on')
    }
    return false
}

function toggleMenuItem(e) {
    var contentDiv = e.target.parentElement.parentElement.querySelector('.menu-item-content')
    contentDiv.classList.contains('open') ? contentDiv.classList.remove('open') : contentDiv.classList.add('open')
    return false
}

const getHTMLForNewUserAnnouncement = newUserDetails => {
  const nameAndLanguageHTML = 
    `<i class="person-name">${newUserDetails.name}</i> just connected in ${newUserDetails.language}`

  const locationHTML = (newUserDetails.locationApiWorkedOK) 
    ? ` 
    from 
    <img class="icon-flag" src="${newUserDetails.countryFlag}" height="15" width="20" />
    ${newUserDetails.country} `
    : ``

  const timeHTML = (newUserDetails.weatherApiWorkedOK)
    ? ` at ${newUserDetails.localtime} local time`
    : ``

  return nameAndLanguageHTML + locationHTML + timeHTML
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







// Socket handling
function joinNewUser(name, language) {

  // announce new user
  socket.emit('new-user', roomName, name, language, usersIp);

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
      <image class="icon-copy" src="./images/icon-copy.png" onclick="copyToClipboard()" />`
  })
})

socket.on('user-connected', (newUserDetails, activeUsers) => {
  appendMessage({
    textInfo: getHTMLForNewUserAnnouncement(newUserDetails)
  })
  appendActiveUsers(activeUsers)
})

socket.on('user-disconnected', (name, activeUsers) => {
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

function copyToClipboard(e) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(location.href)
    document.querySelectorAll('.icon-copy').forEach(item => {
      item.classList.add('copied')
    })
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
  window.scrollTo(0, document.body.scrollHeight)
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

