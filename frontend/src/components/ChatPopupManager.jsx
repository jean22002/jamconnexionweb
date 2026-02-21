import { useState, useEffect } from 'react';
import ChatPopup from './ChatPopup';

export default function ChatPopupManager() {
  const [openChats, setOpenChats] = useState([]);
  const [minimizedChats, setMinimizedChats] = useState(new Set());

  useEffect(() => {
    console.log('🎧 ChatPopupManager - Monté et prêt');
    console.log('🎧 Nombre de chats ouverts:', openChats.length);
    
    // Test: Afficher un message de test
    const testTimeout = setTimeout(() => {
      console.log('🧪 Test: Vérification que le gestionnaire fonctionne');
    }, 2000);
    
    return () => clearTimeout(testTimeout);
  }, []);

  useEffect(() => {
    // Écouter les nouveaux messages
    const handleNewMessage = (event) => {
      console.log('📨 ChatPopupManager - Événement new-message-received reçu:', event.detail);
      
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
        
        console.log('✅ Ouverture d\'un nouveau chat pour:', senderName, 'ID:', senderId);
        
        setOpenChats(prev => {
          const updated = [...prev, newChat];
          console.log('📊 Nouveaux chats ouverts:', updated.length);
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
        console.log('ℹ️ Chat déjà ouvert - Dé-minimisation');
        // Dé-minimiser si minimisé
        setMinimizedChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(senderId);
          return newSet;
        });
      }
    };

    console.log('🎧 ChatPopupManager - Installation de l\'écouteur d\'événements');
    window.addEventListener('new-message-received', handleNewMessage);
    
    return () => {
      console.log('🎧 ChatPopupManager - Suppression de l\'écouteur');
      window.removeEventListener('new-message-received', handleNewMessage);
    };
  }, [openChats]);

  const handleClose = (partnerId) => {
    console.log('🗑️ Fermeture du chat:', partnerId);
    setOpenChats(prev => prev.filter(chat => chat.partnerId !== partnerId));
    setMinimizedChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(partnerId);
      return newSet;
    });
  };

  const handleMinimize = (partnerId) => {
    console.log('↕️ Basculer minimisation:', partnerId);
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

  console.log('🎨 Rendu du ChatPopupManager avec', openChats.length, 'chat(s)');

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
