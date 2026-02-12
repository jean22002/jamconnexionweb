import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  ArrowLeft, Loader2, Send, Search, Music, User, Plus, X, MessageCircle, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MessagesImproved() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Auto-scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Poll for new messages every 5 seconds when conversation is selected
    if (selectedConversation) {
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Get inbox and sent messages
      const [inboxRes, sentRes] = await Promise.all([
        axios.get(`${API}/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/messages/sent`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      // Group messages by conversation partner
      const conversationsMap = new Map();

      // Process inbox
      inboxRes.data.forEach(msg => {
        const partnerId = msg.sender_id;
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            id: partnerId,
            partnerName: msg.sender_name,
            partnerImage: msg.sender_image,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: msg.is_read ? 0 : 1,
            messages: []
          });
        } else {
          const conv = conversationsMap.get(partnerId);
          if (new Date(msg.created_at) > new Date(conv.lastMessageTime)) {
            conv.lastMessage = msg.content;
            conv.lastMessageTime = msg.created_at;
          }
          if (!msg.is_read) conv.unreadCount++;
        }
      });

      // Process sent
      sentRes.data.forEach(msg => {
        const partnerId = msg.recipient_id;
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            id: partnerId,
            partnerName: msg.recipient_name,
            partnerImage: null,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
            messages: []
          });
        } else {
          const conv = conversationsMap.get(partnerId);
          if (new Date(msg.created_at) > new Date(conv.lastMessageTime)) {
            conv.lastMessage = msg.content;
            conv.lastMessageTime = msg.created_at;
          }
        }
      });

      // Convert to array and sort by last message time
      const convArray = Array.from(conversationsMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      setConversations(convArray);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId, silent = false) => {
    try {
      const [inboxRes, sentRes] = await Promise.all([
        axios.get(`${API}/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/messages/sent`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      // Filter messages for this conversation
      const conversationMessages = [
        ...inboxRes.data.filter(m => m.sender_id === partnerId),
        ...sentRes.data.filter(m => m.recipient_id === partnerId)
      ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setMessages(conversationMessages);

      // Mark unread messages as read
      const unreadMessages = conversationMessages.filter(m => 
        m.recipient_id === user.id && !m.is_read
      );
      
      for (const msg of unreadMessages) {
        await axios.put(`${API}/messages/${msg.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (!silent) scrollToBottom();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await axios.post(
        `${API}/messages`,
        {
          recipient_id: selectedConversation.id,
          subject: 'Chat',
          content: newMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations();
      scrollToBottom();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (partnerId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.')) {
      return;
    }

    try {
      await axios.delete(
        `${API}/messages/conversation/${partnerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Conversation supprimée');
      setSelectedConversation(null);
      setMessages([]);
      fetchConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression de la conversation');
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Search musicians and venues
      const [musiciansRes, venuesRes] = await Promise.all([
        axios.get(`${API}/musicians`),
        axios.get(`${API}/venues`)
      ]);

      const musicians = musiciansRes.data
        .filter(m => m.user_id !== user.id && m.pseudo.toLowerCase().includes(query.toLowerCase()))
        .map(m => ({ 
          ...m, 
          type: 'musician', 
          name: m.pseudo,
          profile_image: m.profile_image
            ? (m.profile_image.startsWith('http')
                ? m.profile_image
                : `${API}${m.profile_image}`)
            : ""
        }));

      const venues = venuesRes.data
        .filter(v => v.user_id !== user.id && v.name.toLowerCase().includes(query.toLowerCase()))
        .map(v => ({ 
          ...v, 
          type: 'venue',
          profile_image: v.profile_image
            ? (v.profile_image.startsWith('http')
                ? v.profile_image
                : `${API}${v.profile_image}`)
            : ""
        }));

      setSearchResults([...musicians, ...venues]);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startNewConversation = (userToContact) => {
    setSelectedConversation({
      id: userToContact.user_id,
      partnerName: userToContact.name,
      partnerImage: userToContact.profile_image,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    });
    setShowNewConversation(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              to={user?.role === 'musician' ? '/musician' : '/venue'} 
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold text-xl">Messages</span>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 bg-destructive text-xs rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>

            <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphism border-white/10 max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouvelle conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      placeholder="Rechercher un musicien ou établissement..."
                      className="pl-10 bg-black/20 border-white/10"
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {searchResults.length === 0 && searchQuery ? (
                      <p className="text-center text-muted-foreground py-8">Aucun résultat</p>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          key={result.user_id}
                          onClick={() => startNewConversation(result)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          {result.profile_image ? (
                            <img 
                              src={result.profile_image} 
                              alt="" 
                              className="w-12 h-12 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              {result.type === 'musician' ? (
                                <User className="w-6 h-6 text-primary" />
                              ) : (
                              <Music className="w-6 h-6 text-primary" />
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{result.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.type === 'musician' ? '🎸 Musicien' : '🎪 Établissement'}
                              {result.city && ` • ${result.city}`}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)]">
        <div className="h-full max-w-7xl mx-auto flex">
          {/* Conversations List */}
          <div className={`w-full md:w-96 border-r border-white/10 flex flex-col bg-background/50 ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}>
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une conversation..."
                  className="pl-10 bg-black/20 border-white/10"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 px-4 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune conversation</p>
                  <p className="text-sm mt-2">Commencez une nouvelle conversation</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                      selectedConversation?.id === conv.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    {conv.partnerImage ? (
                      <img 
                        src={conv.partnerImage} 
                        alt="" 
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">{conv.partnerName}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {new Date(conv.lastMessageTime).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-primary text-xs rounded-full flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${
            selectedConversation ? 'flex' : 'hidden md:flex'
          }`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-background/80">
                  {/* Back button for mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  
                  {selectedConversation.partnerImage ? (
                    <img 
                      src={selectedConversation.partnerImage} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{selectedConversation.partnerName}</p>
                    <p className="text-xs text-muted-foreground">En ligne</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteConversation(selectedConversation.id)}
                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    title="Supprimer la conversation"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${
                          isMe 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        } rounded-2xl px-4 py-2`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-background/80">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrivez un message..."
                      className="flex-1 bg-black/20 border-white/10"
                      disabled={sending}
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-primary hover:bg-primary/90 rounded-full"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Sélectionnez une conversation</p>
                  <p className="text-sm mt-2">Ou démarrez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
