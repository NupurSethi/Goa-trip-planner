import { useState, useRef, useEffect } from 'react';
import { planTrip } from './api';

const starterMessage = {
  id: 1,
  role: 'assistant',
  text: "Hi! I can help plan your Goa trip. Tell me your budget, dates, and travel style.",
};

const historyItems = [
  'Goa family trip',
  'Budget beach vacation',
  'North Goa itinerary',
  '3-day relaxation plan',
];

function ChatApp() {
  const [messages, setMessages] = useState([starterMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null); // Store conversation ID
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass conversationId with the query - will be null for first message
      const result = await planTrip(trimmed, conversationId);

      // Store the conversationId from the response for future messages
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: result.plan || result.error || 'No response received.',
          source: result.responseSource || 'unknown',
          sourceDetails: result.sourceDetails || {}
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: 'assistant',
          text: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([starterMessage]);
    setInput('');
    setConversationId(null);
  };

  return (
    <div className="chat-shell">
      <aside className="sidebar glass-panel">
        <div className="brand-row">
          <div className="brand-mark">✈</div>
          <div>
            <div className="brand-name">Plan a Trip</div>
            <div className="brand-subtitle">Travel AI</div>
          </div>
        </div>

        <button 
          onClick={startNewConversation}
          className="new-chat-btn"
          style={{
            width: '100%',
            padding: '10px 12px',
            margin: '12px 0',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4338ca'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#4f46e5'}
        >
          + New Chat
        </button>

        <div className="history-header">Recent chats</div>
        <div className="history-list">
          {historyItems.map((item, index) => (
            <button key={item} className={`history-item ${index === 0 ? 'active' : ''}`}>
              {item}
            </button>
          ))}
        </div>
      </aside>

      <main className="main-panel glass-panel">
        <header className="chat-header">
          <div className="header-left">
            <div className="logo-badge">✦</div>
            <div>
              <h1>Goa Travel Planner</h1>
              <p>Personalized itineraries</p>
            </div>
          </div>
        </header>

        <div className="chat-box">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
            >
              {message.role === 'assistant' && message.source && (
                <div
                  className="source-badge"
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    backgroundColor:
                      message.source === 'llm-knowledge'
                        ? '#f0f4ff'
                        : message.source === 'tools'
                        ? '#f0fff4'
                        : '#fff5f0',
                    color:
                      message.source === 'llm-knowledge'
                        ? '#4f46e5'
                        : message.source === 'tools'
                        ? '#059669'
                        : '#d97706',
                  }}
                  title={message.sourceDetails?.note || ''}
                >
                  {message.source === 'llm-knowledge'
                    ? '💡 LLM Knowledge'
                    : message.source === 'tools'
                    ? `🔧 Tools (${message.sourceDetails?.meaningfulToolRounds ?? message.sourceDetails?.toolRoundsRequested ?? 1})`
                    : '📊 Mixed'}
                </div>
              )}
              <div className="bubble-text">{message.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="bubble assistant">
              <div className="bubble-text typing">Thinking...</div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="composer">
          <textarea
            rows="2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your trip..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? 'Wait...' : 'Send'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default ChatApp;
