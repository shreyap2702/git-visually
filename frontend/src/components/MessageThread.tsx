import { Message } from '@/contexts/AnalysisContext'
import './MessageThread.css'

interface MessageThreadProps {
  messages: Message[]
}

/**
 * MessageThread - Displays conversation history
 * Shows user queries and assistant responses with rendered components
 */
function MessageThread({ messages }: MessageThreadProps) {
  if (messages.length === 0) {
    return <div className="message-thread-empty">No messages yet</div>
  }

  return (
    <div className="message-thread">
      {messages.map((message) => (
        <div key={message.id} className={`message message-${message.type}`}>
          <div className="message-content">
            <p className="message-text">{message.content}</p>
            {message.component && (
              <div className="message-component-indicator">
                Component: {message.component.type}
              </div>
            )}
          </div>
          <span className="message-time">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ))}
    </div>
  )
}

export default MessageThread
