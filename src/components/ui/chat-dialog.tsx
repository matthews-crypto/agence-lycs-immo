import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useAgencyContext } from "@/contexts/AgencyContext";

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDialog({ isOpen, onClose }: ChatDialogProps) {
  const { agency } = useAgencyContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://lycs.app.n8n.cloud/webhook/8a649953-4493-47b7-af78-4ad747e59f21/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          agencyName: agency?.agency_name,
          agencyId: agency?.id
        })
      });

      const data = await response.json();
      
      const botMessage: Message = {
        role: 'bot',
        content: data.response || "Désolé, je n'ai pas pu traiter votre demande."
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'bot',
        content: "Désolé, une erreur est survenue lors de l'envoi du message."
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
        <h3 className="font-semibold">Assistant {agency?.agency_name}</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-[calc(100%-8rem)] max-h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
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
  );
}
