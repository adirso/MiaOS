import { useState, useRef, useEffect } from 'react';
import './Chat.css';

type MessageRole = 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

const GREETING = 'Hey, my name is Mia. How can I help you?';

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Request failed');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>Chat</h1>
      </header>

      <div className="chat-content">
        <div className="chat-messages" ref={listRef}>
          {messages.length === 0 && (
            <div className="chat-greeting">{GREETING}</div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message chat-message--${msg.role}`}>
              <span className="chat-message-role">
                {msg.role === 'user' ? 'You' : 'Mia'}
              </span>
              <div className="chat-message-content">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message chat-message--assistant">
              <span className="chat-message-role">Mia</span>
              <div className="chat-message-content chat-loading">Thinking…</div>
            </div>
          )}
        </div>

        {error && <div className="chat-error">{error}</div>}

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-send" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
