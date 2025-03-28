// Update this page (the content is just a fallback if you fail to update the page)
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, MessageCircle } from 'lucide-react';
import { useAgencyContext } from "@/contexts/AgencyContext";

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const Index = () => {
  const { agency } = useAgencyContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    
    // Ajouter le message de l'utilisateur à la liste des messages
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Appel à l'API n8n avec les en-têtes requis
      const response = await fetch('https://lycs.app.n8n.cloud/webhook-test/webChatTest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-is-trusted': 'yes'
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      
      // Vérifier la structure de la réponse
      if (data.status === 'success' && data.data && data.data.output) {
        // Ajouter la réponse du bot à la liste des messages
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Bienvenue chez LYCS Immo</h1>
          <p className="text-xl text-gray-600">Votre partenaire immobilier de confiance</p>
        </div>
      </div>

      {/* Bouton de chat flottant */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 rounded-full p-3 hover:opacity-90"
        size="icon"
        style={{ backgroundColor: agency?.primary_color || '#000000' }}
      >
        <MessageCircle className="h-4 w-4 text-white" />
      </Button>

      {/* Dialog du chat */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Assistant {agency?.agency_name || 'LYCS Immo'}</h3>
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
                      ? 'ml-auto bg-blue-500 text-white'
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
                style={{
                  backgroundColor: agency?.primary_color || '#000000',
                }}
              >
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
