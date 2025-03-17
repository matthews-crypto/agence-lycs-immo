import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

export function HomeFloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    </>
  );
}
