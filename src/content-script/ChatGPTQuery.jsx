import { useEffect, useState } from 'preact/hooks'
import PropTypes from 'prop-types'
import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import Browser from 'webextension-polyfill'
import ChatGPTFeedback from './ChatGPTFeedback'
import './highlight.scss'

function ChatGPTQuery(props) {
  const [answer, setAnswer] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const port = Browser.runtime.connect()
    const listener = (msg) => {
      if (msg.text) {
        setAnswer(msg)
      } else if (msg.error === 'UNAUTHORIZED' || msg.error === 'CLOUDFLARE') {
        setError(msg.error)
      } else {
        setError('EXCEPTION')
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: props.question })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [props.question, retry])

  // retry error on focus
  useEffect(() => {
    const onFocus = () => {
      if (error && error !== 'EXCEPTION') {
        setError('')
        setRetry((r) => r + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [error])

  if (answer) {
    return (
      <div id="answer" className="markdown-body gpt-inner" dir="auto">
        <div className="gpt-header">
          <p>chatgptcn.tk</p>
          <ChatGPTFeedback messageId={answer.messageId} conversationId={answer.conversationId} />
        </div>
        <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
          {answer.text}
        </ReactMarkdown>
      </div>
    )
  }

  if (error === 'UNAUTHORIZED' || error === 'CLOUDFLARE') {
    return (
      <p className="gpt-inner">
        可能有错误发生，请使用chatgptcn访问：{' '}
        <a href="https://chatgptcn.tk" target="_blank" rel="noreferrer">
          chatgptcn.tk
        </a>
      </p>
    )
  }
  if (error) {
    return <p className="gpt-inner">Failed to load response from chatgptcn.tk</p>
  }

  return <p className="gpt-loading gpt-inner">正在思考，请稍候...</p>
}

ChatGPTQuery.propTypes = {
  question: PropTypes.string.isRequired,
}

export default memo(ChatGPTQuery)
