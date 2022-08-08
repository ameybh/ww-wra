---
title: I made a WhatsApp bot to solve Math problems
published: true
description: Whatsapp Web bot to query and get results to and from WolframAlpha API. Contains code and tutorial. Made using npm node. 
tags: bot,node,api,wolframalpha
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k7kh51pwu9fvrk35eibc.png
---

![image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/aytpl9th2h7uae77fhho.png)
 

I am fascinated by chatbots. They can carry out any task automatically for you and can be invoked at a single command. I found bots on Discord and was intrigued to make one for WhatsApp. But, WhatsApp doesn't share its official API with everyone. Fortunately, many workarounds exist using WhatsApp Web. I used [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) to ease authentication and messaging controls. It provides a simple WhatsApp Web client built using Node & Puppeteer.

Using this bot, you can add more functionality and automate anything you'd like. Maybe you want to monitor your servers or get random memes. I found WolframAlpha's computational intelligence fascinating and hence decided to integrate its API with WhatsApp messaging.

##### Here's the Github code repository. You can get setup the bot and start playing with it directly.
{% github ameybhavsar24/ww-wra no-readme %}

And if like creating things from scratch, let's not waste any time and get started building the bot! :smile:

## Setup
### Start a new NPM project in your favourite project directory 
```
$ npm init
```
### Install Whatsapp Web packages. 
We need `whatsapp-web.js` for WhatsApp client and `qrcode-terminal` to parse the auth information into visible QR code.
```
$ npm i whatsapp-web.js qrcode-terminal
```
### Boilerplate code to get started.

Create a new file `index.js` and add the following code.
```javascript
const qrcode = require('qrcode-terminal')
const { Client } = require('whatsapp-web.js')

// open whatsapp web in a headless browser (no gui)
const puppeteerOptions = {
  headless: true,
  args: ['--no-sandbox'],
}

// initialize client object
const client = new Client({
  puppeteer: puppeteerOptions,
})

// prints QR code to console when received
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
  console.log('Client is ready!')
})

// listen for new messages
client.on('message_create', (message) => {
  const messageBody = message.body
  console.log(messageBody)
  if (messageBody == '!ping') {
    message.reply('pong')
  }
})

client.initialize()

```

This will initialize a client instance. We pass `puppeteerOptions` to `client` to disable a GUI. 
Notice the `message_create` event. The client listens for any new messages. Right now, we will listen to only `!ping` and respond with `pong`.
Add the following start script to `package.json`.
```json
"scripts": {
  "start": "node index.js"
},
```
Start the node app with
```console
$ npm start
```
![Screenshot from 2021-07-12 12-47-45](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a9g4boi8ktwumv4m2m43.png)
 

You should see a QR code displayed in the terminal. Scan this QR code with the WhatsApp Web option in the WhatsApp menu.
Once scanned successfully, you should see a message **Client is ready!** in the console. 
If you send *!ping* in any direct or group chat, the bot should reply with *pong*. If the bot is running with the same account as yours, it will reply as you.

**Note**: WhatsApp only allows web use from a single session. If already web sessions are active (for e.g.: on a browser), they will automatically become inactive.
![image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9nsw6rg59z9sixus7tgl.png)

### Responding to Math problems
To solve Math problems, we are going to use the [Wolfram|Alpha API](https://products.wolframalpha.com/api/).
Sign up for a free account and create a new app on the [Developer Portal](https://developer.wolframalpha.com/portal/myapps/) by clicking on **Get an App ID** button.
Give your app a cool name and description.
Remember to note the App ID. You can always check it again by clicking the **Edit** link on the app card.
![image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rc7e4sjb8gpcnmh6ihyq.png)
Create a new file called `.env` and paste the `APPID`.
```shell
APPID=<App ID from Wolfram|Alpha API here>
```
To use this variable in our code, we can use the dotenv package. To install `dotenv`:
```shell
npm i dotenv
```
Then, initialize dotenv by adding this line at the top of `index.js`:
```javascript
require('dotenv').config()
```
Wolfram|Alpha provides official modules to call its functions. Download [WolframAlphaAPI.js](https://products.wolframalpha.com/api/libraries/javascript/WolframAlphaAPI.js.html) to your project directory. We can then require it and initialize the instance as follows:
```javascript
...
const { Client } = require('whatsapp-web.js')

const appid = process.env.APPID
const WolframAlphaAPI = require('./WolframAlphaAPI.js')
let wraAPI = WolframAlphaAPI(appid)
const invokeKey = '!b'
const puppeteerOptions = {
...
```
Here, we are getting the `appid` from process and then initializing WolframAlphaAPI instance `wraAPI` which will later handle all functions.
Also, it's a good idea to have invoke keys (basically strings with which messages are prefixed) so the bot can differentiate between normal messages and commands.

Try running `npm start` to make sure no errors are present. You should still see a QR code and after authenticating any new messages should be logged.

If you find any errors and need help, feel free to comment them and I'll definately take a look!

Ok, it's been a long way and we are almost done.

Let's handle bot commands and add reply functionality.
Edit `index.js` to handle message.
```javascript
client.on('message_create', (message) => {
  const messageBody = message.body
  if (messageBody.startsWith(invokeKey)) {
    messageHandler(message)
  }
})
// receive all bot commands and reply accordingly
const messageHandler = (message) => {
  // get message body and trim invokeKey
  let query = message.body.substring(invokeKey.length + 1)
  console.log(`Querying result for ${query}`)
  handleImage(message, query, wraAPI)
}
```

Before you run `npm start` again, wait a sec! We also need to define the logic for handling image responses in `handleImage`.

Here's how we can do that:
```
npm i parse-data-url
```
Then, add the following to `index.js`
```javascript
const parseDataUrl = require('parse-data-url')
const { MessageMedia } = require('whatsapp-web.js')
const handleImage = (message, text, wraAPI) => {
  try {
    console.log('Image request')
    // send the rest of the message to Wolfram|Alpha API
    wraAPI
      .getSimple({
        i: text,
        timeout: 5,
      })
      .then((res) => {
        const parsed = parseDataUrl(res)
        message.reply(new MessageMedia(parsed.contentType, parsed.data))
      })
      .catch((err) => {
        message.reply(String(err))
      })
  } catch (err) {
    console.log(err)
  }
}
```

#### And ... we're done!
Yep, really. That was it. 
Start the node app again with `npm start`. Once you have authenticated, try this:
![image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/azm1fjo4qi6p18hzeomi.png)
 

And the bot should reply with the correct image output.
Give yourself a pat on the back for finishing this project!

##### Find the complete code for this project on Github. If you find it interesting, do star the repository.

I created another WhatsApp bot with Google search, random jokes, compliments and anime quotes! Check out [ameybhavsar24/ww-wra-goog](https://github.com/ameybhavsar24/ww-wra-goog)

### What's next
Now you have a way to programmatically reply to Whatsapp messages. What you can create with it is limitless. I recommend you to check out following ideas.
* Lots of [prebuilt WolframAlpha APIs](https://products.wolframalpha.com/api/). You can get text & audio responses as well as steps for a problem. You can even use their Conversational API to build a bot with back-and-forth dialog.
* Google search responses 
* Random joke or roast (remember when you need the perfect comeback on a group debate, you're covered now xD)
* Or anything else you find cool.

Right now, you need to scan the QR code for every run but the session can be stored in a JSON file to resume it again. Read more on [Resuming Sessions - whatsapp-web.js guide](https://waguide.pedroslopez.me/features/resuming-sessions).

Thank you for reading this tutorial to the very end! I'm happy you were able to build your own WhatsApp bot. 
If you faced any errors, feel free to comment on them. Also, your feedback on improving this post is welcome.

Author: @ameybhavsar
Github: https://github.com/ameybhavsar24
