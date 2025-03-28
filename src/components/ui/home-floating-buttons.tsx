import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, MessageCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export function HomeFloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        const navBottom = nav.getBoundingClientRect().bottom;
        setShowScrollTop(navBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    
    // Ajouter le message de l'utilisateur à la liste des messages
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Appel à l'API n8n avec les en-têtes requis
      const response = await fetch('https://lycs.app.n8n.cloud/webhook/8a649953-4493-47b7-af78-4ad747e59f21/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-is-trusted': 'yes',
          'x-forwarded-for': '127.0.0.1',
          'x-forwarded-host': 'localhost',
          'x-forwarded-port': '443',
          'x-forwarded-proto': 'https',
          'x-forwarded-server': 'localhost',
          'x-real-ip': '127.0.0.1'
        },
        body: JSON.stringify({ 
          message: userMessage 
        })
      });

      const data = await response.json();
      console.log('Réponse du serveur:', data);
      
      // Vérifier la structure de la réponse
      if (data && data.output) {
        // Structure selon l'exemple de la documentation
        setMessages(prev => [...prev, { role: 'bot', content: data.output }]);
      } else if (data && data.response) {
        // Structure alternative possible
        setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
      } else if (data && data.data && data.data.output) {
        // Structure selon la documentation
        setMessages(prev => [...prev, { role: 'bot', content: data.data.output }]);
      } else {
        console.error('Structure inattendue de la réponse:', data);
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: 'Désolé, je n\'ai pas compris la réponse.' 
        }]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Désolé, une erreur est survenue lors de l\'envoi du message.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton de défilement à gauche */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 left-4 rounded-full p-3 hover:opacity-90 bg-black"
          size="icon"
        >
          <ChevronUp className="h-4 w-4 text-white" />
        </Button>
      )}

      {/* Bouton de chat à droite (toujours visible) */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 rounded-full p-3 hover:opacity-90 bg-[#aa1ca0]"
        size="icon"
      >
        <MessageCircle className="h-4 w-4 text-white" />
      </Button>

      {/* Dialog du chat */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Assistant LYCS Immo</h3>
            <Button
              onClick={() => setIsChatOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-[calc(100%-8rem)] max-h-96 flex flex-col">
            <div id="chatBox" className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 && (
                <div className="mr-auto bg-gray-100 p-2 rounded-lg">
                  Bonjour, comment puis-je vous aider aujourd'hui ?
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg max-w-[80%] ${
                    message.role === 'user'
                      ? 'ml-auto bg-[#aa1ca0] text-white'
                      : 'mr-auto bg-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="mr-auto bg-gray-100 p-2 rounded-lg">
                  En train d'écrire...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez votre message..."
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading}
                className="bg-[#aa1ca0] hover:bg-[#8a1680]"
              >
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
