
import { Helmet } from "react-helmet-async";
import { getAbsoluteUrl } from "@/utils/urlUtils";
import { getPrerenderUrl, shouldPrerender } from "@/middleware/prerenderMiddleware";
import { useEffect } from "react";

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
  console.log('Preview URL:', getPrerenderUrl(window.location.href));
  console.log('User Agent:', window.navigator.userAgent);
  console.log('Should Prerender:', shouldPrerender(window.navigator.userAgent));
  
  useEffect(() => {
    const updateMetaTags = () => {
      const metaTags = {
        'og:title': `${title} | ${agencyName || 'LYCS Immobilier'}`,
        'og:description': description,
        'og:image': photos?.[0] ? getAbsoluteUrl(photos[0]) : '',
        'og:url': window.location.href
      };

      Object.entries(metaTags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    };

    updateMetaTags();
  }, [title, description, photos, agencyName]);

  const truncatedDescription = description
    ? description.length > 160
      ? `${description.substring(0, 160)}...`
      : description
    : "";

  const pageTitle = `${title} | ${agencyName || 'LYCS Immobilier'}`;
  const firstPhotoUrl = photos?.[0];
  const absoluteImageUrl = firstPhotoUrl ? getAbsoluteUrl(firstPhotoUrl) : '';

  return (
    <Helmet prioritizeSeoTags>
      <title>{pageTitle}</title>
      <meta name="description" content={truncatedDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={window.location.href} />
      <meta property="og:site_name" content={agencyName || 'LYCS Immobilier'} />
      
      {/* Image tags */}
      {firstPhotoUrl && (
        <>
          <meta property="og:image" content={absoluteImageUrl} />
          <meta property="og:image:secure_url" content={absoluteImageUrl} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={title} />
        </>
      )}

      {/* Prix et détails */}
      <meta property="og:price:amount" content={price.toString()} />
      <meta property="og:price:currency" content="FCFA" />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      {firstPhotoUrl && (
        <meta name="twitter:image" content={absoluteImageUrl} />
      )}
    </Helmet>
  );
}
