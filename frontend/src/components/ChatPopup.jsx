import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Minimize2, Send, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatPopup({ conversation, onClose, onMinimize, isMinimized }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isMinimized && conversation) {
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversation, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const [inboxRes, sentRes] = await Promise.all([
        axios.get(`${API}/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/messages/sent`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      // Filter messages for this conversation
      const allMessages = [
        ...inboxRes.data.filter(m => m.sender_id === conversation.partnerId),
        ...sentRes.data.filter(m => m.recipient_id === conversation.partnerId)
      ];

      // Sort by date
      allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(allMessages);

      // Mark messages as read
      const unreadMessages = allMessages.filter(m => m.sender_id === conversation.partnerId && !m.is_read);
      for (const msg of unreadMessages) {
        try {
          await axios.put(`${API}/messages/${msg.id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          console.error('Error marking message as read:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await axios.post(
        `${API}/messages/`,
        {
          recipient_id: conversation.partnerId,
          content: newMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="w-64 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl shadow-2xl cursor-pointer hover:scale-105 transition-transform flex items-center justify-between px-4"
        onClick={onMinimize}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm truncate">{conversation.partnerName}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white hover:text-gray-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 h-[500px] bg-gray-900 rounded-t-xl shadow-2xl flex flex-col border border-white/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {conversation.partnerImage ? (
              <img src={conversation.partnerImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <MessageCircle className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="text-white font-medium text-sm truncate max-w-[180px]">
            {conversation.partnerName}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={onMinimize} className="text-white hover:text-gray-200 transition">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender_id === user.id;
          return (
            <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                isOwn 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'bg-gray-800 text-white'
              }`}>
                <p className="text-sm break-words">{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-gray-900 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Aa"
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-full"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
