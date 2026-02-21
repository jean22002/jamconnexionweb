import { useState, useEffect } from 'react';
import ChatPopup from './ChatPopup';

export default function ChatPopupManager() {
  const [openChats, setOpenChats] = useState([]);
  const [minimizedChats, setMinimizedChats] = useState(new Set());

  useEffect(() => {
    // Écouter les nouveaux messages
    const handleNewMessage = (event) => {
      const { senderId, senderName, senderImage, message } = event.detail;
      
      if (!senderId) {
        console.error('❌ SenderId manquant dans l\'événement');
        return;
      }
      
      // Vérifier si le chat est déjà ouvert
      const existingChat = openChats.find(chat => chat.partnerId === senderId);
      
      if (!existingChat) {
        // Ouvrir un nouveau chat
        const newChat = {
          partnerId: senderId,
          partnerName: senderName,
          partnerImage: senderImage,
          lastMessage: message
        };
        
        setOpenChats(prev => {
          const updated = [...prev, newChat];
          // Limiter à 3 chats ouverts maximum
          return updated.slice(-3);
        });
        
        // Ne pas minimiser le nouveau chat
        setMinimizedChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(senderId);
          return newSet;
        });
      } else {
        // Dé-minimiser si minimisé
        setMinimizedChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(senderId);
          return newSet;
        });
      }
    };

    window.addEventListener('new-message-received', handleNewMessage);
    
    return () => {
      window.removeEventListener('new-message-received', handleNewMessage);
    };
  }, [openChats]);

  const handleClose = (partnerId) => {
    setOpenChats(prev => prev.filter(chat => chat.partnerId !== partnerId));
    setMinimizedChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(partnerId);
      return newSet;
    });
  };

  const handleMinimize = (partnerId) => {
    setMinimizedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partnerId)) {
        newSet.delete(partnerId);
      } else {
        newSet.add(partnerId);
      }
      return newSet;
    });
  };

  if (openChats.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-4 flex gap-2 z-50 pointer-events-none">
      {openChats.map((chat, index) => (
        <div 
          key={chat.partnerId} 
          style={{ marginRight: `${index * 8}px` }}
          className="pointer-events-auto"
        >
          <ChatPopup
            conversation={chat}
            onClose={() => handleClose(chat.partnerId)}
            onMinimize={() => handleMinimize(chat.partnerId)}
            isMinimized={minimizedChats.has(chat.partnerId)}
          />
        </div>
      ))}
    </div>
  );
}
