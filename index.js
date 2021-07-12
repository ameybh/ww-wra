require('dotenv').config()
const qrcode = require('qrcode-terminal')
const { Client } = require('whatsapp-web.js')

const appid = process.env.APPID
const WolframAlphaAPI = require('./WolframAlphaAPI.js')
let wraAPI = WolframAlphaAPI(appid)
const invokeKey = '!b'

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
client.initialize()
