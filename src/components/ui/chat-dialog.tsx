import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp?: string;
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agency?: {
    id: string;
    agency_name: string;
    primary_color?: string;
  };
}

export function ChatDialog({ isOpen, onClose, agency }: Readonly<ChatDialogProps>) {
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
      console.log('Envoi de message au webhook principal:', userMessage.content);
      console.log('Données envoyées:', {
        message: userMessage.content
      });
      
      const response = await fetch('https://lycs.app.n8n.cloud/webhook-test/webChatTest', {
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
      console.log('Réponse complète du webhook principal:', data);
      
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
      console.error('Error sending message to main webhook:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Assistant LYCS IMMO</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="h-60 overflow-y-auto mb-4 space-y-2 p-2 border rounded-md">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`p-2 rounded-lg max-w-[80%] ${
              message.role === 'user'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {message.role === 'user' ? (
              message.content
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a 
                        {...props} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      />
                    )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
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
  );
}
