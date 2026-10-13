import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, MessageSquare, Flame, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../utils/socket';

export default function RoomChat({ roomId, onSendReaction }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const socket = getSocket();

  useEffect(() => {
    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('new_room_chat', handleNewMessage);
    return () => {
      socket.off('new_room_chat', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.emit('room_chat_message', {
      roomId,
      text: inputText.trim()
    });

    setInputText('');
  };

  const reactions = [
    { emoji: '🍿', label: 'Popkorn' },
    { emoji: '🔥', label: 'Olov' },
    { emoji: '❤️', label: 'Yurak' },
    { emoji: '👏', label: 'Qarsaklar' },
    { emoji: '😂', label: 'Kulgu' },
    { emoji: '😱', label: 'Dahshat' }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md">
      
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-red-500" />
          <span>Xona chati</span>
        </h4>
        <span className="text-[10px] text-zinc-500 font-mono">Real-time</span>
      </div>

      {/* Floating Reactions Quick Bar */}
      <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-around">
        {reactions.map((r, i) => (
          <button
            key={i}
            onClick={() => onSendReaction(r.emoji)}
            title={r.label}
            className="text-lg hover:scale-135 active:scale-95 transition-transform p-1 rounded-lg hover:bg-zinc-800"
          >
            {r.emoji}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[160px] max-h-[300px] text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-center text-xs p-4">
            Do‘stlaringiz bilan xabarlashing va emojilar yuboring!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = user && m.userId === user.id;
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={m.userAvatar}
                  alt={m.userName}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
                <div
                  className={`max-w-[75%] rounded-xl p-2.5 ${
                    isMe
                      ? 'bg-red-600 text-white rounded-tr-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  <p className="text-[10px] font-bold opacity-80 mb-0.5">
                    {isMe ? 'Siz' : m.userName}
                  </p>
                  <p className="leading-snug break-words">{m.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-800 bg-zinc-900/60 flex gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white p-2 rounded-xl transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
