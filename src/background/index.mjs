import ExpiryMap from 'expiry-map'
import { v4 as uuidv4 } from 'uuid'
import Browser from 'webextension-polyfill'
import { sendMessageFeedback } from './chatgpt.mjs'
import { fetchSSE } from './fetch-sse.mjs'

const KEY_ACCESS_TOKEN = 'accessToken'

const cache = new ExpiryMap(10 * 1000)

async function getAccessToken() {
  if (cache.get(KEY_ACCESS_TOKEN)) {
    return cache.get(KEY_ACCESS_TOKEN)
  }
  const resp = await fetch('https://chat.openai.com/api/auth/session')
  if (resp.status === 403) {
    throw new Error('CLOUDFLARE')
  }
  const data = await resp.json().catch(() => ({}))
  if (!data.accessToken) {
    throw new Error('UNAUTHORIZED')
  }
  cache.set(KEY_ACCESS_TOKEN, data.accessToken)
  return data.accessToken
}

async function generateAnswers(port, question) {
  //const accessToken = await getAccessToken()
  console.log('question=', question)
  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
  })
  const response = await fetch('https://api.chatgptcn.tk/api/base/quest', {
    method: 'POST',
    body: JSON.stringify({ 
      prompt : question, 
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  const text = data.data.answ
  if (text) {
    port.postMessage({
      text,
      //messageId: data.message.id,
      //conversationId: data.conversation_id,
    })
  }
}

Browser.runtime.onConnect.addListener((port) => {
  console.log('Hello,onConnect.addListener,port:', port)
  port.onMessage.addListener(async (msg) => {
    console.log('received msg', msg)
    try {
      await generateAnswers(port, msg.question)
    } catch (err) {
      console.log(err)
      port.postMessage({ error: err.message })
      // cache.delete(KEY_ACCESS_TOKEN)
    }
  })
})

Browser.runtime.onMessage.addListener(async (message) => {
  console.log('Hello,onMesage.addListener,message:', message)
  if (message.type === 'FEEDBACK') {
    const token = await getAccessToken()
    await sendMessageFeedback(token, message.data)
  }
})
