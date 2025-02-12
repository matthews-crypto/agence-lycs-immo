
import { useEffect } from "react";
import { getAbsoluteUrl } from "@/utils/urlUtils";

interface PropertyMetaTagsProps {
  title: string;
  description: string;
  price: number;
  photos?: string[];
  agencyName?: string;
}

export default function PropertyMetaTags({
  title,
  description,
  price,
  photos,
  agencyName
}: PropertyMetaTagsProps) {
  console.log('PropertyMetaTags - Photos reçues:', photos);
  
  useEffect(() => {
    const updateMetaTags = () => {
      const tags = [
        { property: 'og:title', content: `${title} | ${agencyName || 'LYCS Immobilier'}` },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: window.location.href },
        { property: 'og:site_name', content: agencyName || 'LYCS Immobilier' },
        { property: 'og:price:amount', content: price.toString() },
        { property: 'og:price:currency', content: 'FCFA' }
      ];

      if (photos?.[0]) {
        const imageUrl = getAbsoluteUrl(photos[0]);
        tags.push(
          { property: 'og:image', content: imageUrl },
          { property: 'og:image:secure_url', content: imageUrl },
          { property: 'og:image:type', content: 'image/jpeg' },
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '630' },
          { property: 'og:image:alt', content: title }
        );
      }

      // Supprimer les anciens meta tags
      document.querySelectorAll('meta[property^="og:"]').forEach(el => el.remove());

      // Ajouter les nouveaux
      tags.forEach(({ property, content }) => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      });
    };

    updateMetaTags();
    
    // Mettre à jour toutes les 100ms pendant 2 secondes
    const interval = setInterval(updateMetaTags, 100);
    setTimeout(() => clearInterval(interval), 2000);

    return () => clearInterval(interval);
  }, [title, description, photos, agencyName, price]);

  return null;
}

