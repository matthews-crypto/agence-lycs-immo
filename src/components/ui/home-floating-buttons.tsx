import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Loader2, MessageCircle, Phone } from "lucide-react";

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp?: string;
}

export function HomeFloatingButtons() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Envoi de message au webhook principal (home-floating-buttons):', userMessage.content);
      console.log('En-têtes et données envoyées:', {
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
        body: { message: userMessage.content }
      });
      
      const response = await fetch('https://lycs.app.n8n.cloud/webhook/webChatTest', {
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
          message: userMessage.content 
        })
      });

      const data = await response.json();
      console.log('Réponse complète du webhook principal (home-floating-buttons):', data);
      
      // Vérifier la structure de la réponse
      let botResponse = '';
      if (data.status === 'success' && data.data && data.data.output) {
        botResponse = data.data.output;
      } else if (data.output) {
        botResponse = data.output;
      } else if (typeof data === 'string') {
        botResponse = data;
      } else {
        botResponse = "Désolé, je n'ai pas pu comprendre votre demande.";
      }
      
      const botMessage: Message = {
        role: 'bot',
        content: botResponse,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: Message = {
        role: 'bot',
        content: "Désolé, une erreur est survenue lors de l'envoi du message.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 items-end z-50">
      {/* Bouton de téléphone */}
      <Button
        className="rounded-full bg-green-500 hover:bg-green-600 w-12 h-12 flex items-center justify-center"
        onClick={() => window.location.href = 'tel:+22890909090'}
      >
        <Phone className="h-5 w-5" />
      </Button>
      
      {/* Bouton de chat */}
      <Button
        className="rounded-full bg-blue-500 hover:bg-blue-600 w-12 h-12 flex items-center justify-center"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
      
      {/* Fenêtre de chat */}
      {isChatOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Assistant LYCS IMMO</h3>
            <Button
              onClick={() => setIsChatOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="h-60 overflow-y-auto mb-4 space-y-2 p-2 border rounded-md">
            {messages.length === 0 && (
              <div className="bg-gray-100 text-gray-800 p-2 rounded-lg max-w-[80%]">
                Bonjour, comment puis-je vous aider aujourd'hui ?
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`p-2 rounded-lg max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
                {message.timestamp && (
                  <small className="block text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </small>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="bg-gray-100 text-gray-800 p-2 rounded-lg max-w-[80%] flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                En train d'écrire...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tapez votre message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
