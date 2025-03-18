import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, MessageCircle } from 'lucide-react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { ChatDialog } from './chat-dialog';

export function FloatingButtons() {
  const { agency } = useAgencyContext();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const buttonStyle = {
    backgroundColor: agency?.primary_color || '#000000',
  };

  return (
    <>
      {/* Bouton de défilement à gauche */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 left-4 rounded-full p-3 hover:opacity-90"
          size="icon"
          style={buttonStyle}
        >
          <ChevronUp className="h-4 w-4 text-white" />
        </Button>
      )}

      {/* Bouton de chat à droite (toujours visible) */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 rounded-full p-3 hover:opacity-90"
        size="icon"
        style={buttonStyle}
      >
        <MessageCircle className="h-4 w-4 text-white" />
      </Button>

      {/* Dialog du chat */}
      <ChatDialog 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
}
