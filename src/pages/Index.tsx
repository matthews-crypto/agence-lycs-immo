import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { ChatDialog } from "@/components/ui/chat-dialog";

export default function Index() {
  const { agency } = useAgencyContext();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Bienvenue chez LYCS IMMO</h1>
        <p className="text-xl mb-8">
          Votre partenaire immobilier de confiance
        </p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = '/agency/lycs-immo'}
          >
            Accéder à notre agence
          </Button>
        </div>
      </main>

      {/* Bouton flottant pour ouvrir le chat */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 bg-blue-500 hover:bg-blue-600"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Dialog du chat */}
      {isChatOpen && (
        <ChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          agency={agency}
        />
      )}
    </div>
  );
}
