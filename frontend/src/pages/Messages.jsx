import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Music, ArrowLeft, Loader2, Send, Inbox, SendHorizontal, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Messages() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("inbox");
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newMessage, setNewMessage] = useState({ recipient_id: "", subject: "", content: "" });

  useEffect(() => {
    if (token) {
      fetchMessages();
    }
  }, [token]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        axios.get(`${API}/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/messages/sent`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setInbox(inboxRes.data);
      setSent(sentRes.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.put(`${API}/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMessages();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const sendNewMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast.error("Remplissez tous les champs");
      return;
    }

    try {
      await axios.post(`${API}/messages`, newMessage, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Message envoyé ! 📧");
      setShowNewMessageDialog(false);
      setNewMessage({ recipient_id: "", subject: "", content: "" });
      fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    }
  };

  const unreadCount = inbox.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={user?.role === "musician" ? "/musician-dashboard" : "/venue-dashboard"} className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold text-xl">Messages</span>
            </div>

            <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2">
                  <Send className="w-4 h-4" />
                  Nouveau
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphism border-white/10 max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouveau message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>ID Destinataire</Label>
                    <Input
                      value={newMessage.recipient_id}
                      onChange={(e) => setNewMessage({ ...newMessage, recipient_id: e.target.value })}
                      placeholder="User ID du destinataire"
                      className="bg-black/20 border-white/10"
                    />
                    <p className="text-xs text-muted-foreground">Trouvez l'ID sur le profil du musicien/établissement</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Sujet</Label>
                    <Input
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                      placeholder="Objet du message"
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      placeholder="Votre message..."
                      className="bg-black/20 border-white/10"
                      rows={5}
                    />
                  </div>
                  <Button onClick={sendNewMessage} className="w-full bg-primary hover:bg-primary/90 rounded-full">
                    Envoyer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full bg-muted/50 rounded-full p-1 mb-6 gap-1">
            <TabsTrigger value="inbox" className="rounded-full flex-1 whitespace-nowrap">
              <Inbox className="w-4 h-4 mr-2" />
              Reçus ({inbox.length})
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-destructive text-xs rounded-full">{unreadCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-full flex-1 whitespace-nowrap">
              <SendHorizontal className="w-4 h-4 mr-2" />
              Envoyés ({sent.length})
            </TabsTrigger>
          </TabsList>

          {/* Inbox */}
          <TabsContent value="inbox">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : inbox.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun message reçu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inbox.map((message) => (
                  <div
                    key={message.id}
                    className={`glassmorphism rounded-xl p-5 cursor-pointer hover:bg-white/5 transition-all ${!message.is_read ? 'border-l-4 border-primary' : ''}`}
                    onClick={() => !message.is_read && markAsRead(message.id)}
                  >
                    <div className="flex items-start gap-4">
                      {message.sender_image ? (
                        <img src={message.sender_image} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{message.sender_name}</p>
                            <p className="text-sm text-primary">{message.subject}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent */}
          <TabsContent value="sent">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sent.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground glassmorphism rounded-2xl">
                <SendHorizontal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun message envoyé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sent.map((message) => (
                  <div key={message.id} className="glassmorphism rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                        <SendHorizontal className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">À: {message.recipient_name}</p>
                            <p className="text-sm text-primary">{message.subject}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
