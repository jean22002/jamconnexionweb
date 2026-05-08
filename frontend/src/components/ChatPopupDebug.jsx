import { useEffect } from 'react';

export default function ChatPopupDebug() {
  useEffect(() => {
    // Créer un bouton de test en position fixe
    const button = document.createElement('button');
    button.textContent = '🧪 Test Popup';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 9999;
      padding: 10px 20px;
      background: linear-gradient(to right, #a855f7, #ec4899);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    
    button.onclick = () => {
      console.log('🧪 TEST: Déclenchement manuel de l\'événement new-message-received');
      window.dispatchEvent(new CustomEvent('new-message-received', {
        detail: {
          senderId: 'test-user-123',
          senderName: 'Test User',
          senderImage: null,
          message: 'Ceci est un message de test'
        }
      }));
    };
    
    document.body.appendChild(button);
    
    return () => {
      document.body.removeChild(button);
    };
  }, []);
  
  return null;
}
