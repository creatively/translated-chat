# translated-chat
 Chat App with multi-language translation

Visible at
https://translatingchat.com

It uses the Google Translate API, so it supports nearly 100 languages

Tested with 20 Chrome tabs simulating 20 concurrent users, chatting across 5 different languages. In theory it should scale further than this

The first user to Start the chat, gets a code added to their url. This url can be copied and sent to invite others. The url's code represents a specific chat session/room.

It's limitations / suggested next improvements are :
>   it needs a user to be able to scroll up a transcript and/or copy or save or preserve the conversation for future reference
>   it currently shows which users are in the session, but this ideally needs to be more precise, and show if another user is typing or has been dormant for a while
