require('dotenv').config()
const qrcode = require('qrcode-terminal')
const { Client } = require('whatsapp-web.js')

const puppeteerOptions = {
  headless: true,
  args: ['--no-sandbox'],
}

const client = new Client({
  puppeteer: puppeteerOptions,
})

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
  console.log('Client is ready!')
})

client.on('message', (message) => {
  console.log(message)
  const messageBody = message.body.toLowerCase()
  if (messageBody.startsWith('!ping')) {
    message.reply('pong')
  }
})

client.initialize()
