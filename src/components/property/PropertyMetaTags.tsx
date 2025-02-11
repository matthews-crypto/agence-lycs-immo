
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
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) {
      const pageTitle = `${title} | ${agencyName || 'LYCS Immobilier'}`;
      metaTitle.setAttribute('content', pageTitle);
    }
  }, [title, agencyName]);

  const truncatedDescription = description
    ? description.length > 160
      ? `${description.substring(0, 160)}...`
      : description
    : "";

  const pageTitle = `${title} | ${agencyName || 'LYCS Immobilier'}`;
  
  const firstPhotoUrl = photos?.[0];
  console.log('PropertyMetaTags - Première photo:', firstPhotoUrl);
  
  const absoluteImageUrl = firstPhotoUrl ? getAbsoluteUrl(firstPhotoUrl) : '';
  console.log('PropertyMetaTags - URL absolue de l\'image:', absoluteImageUrl);

  return (
    <Helmet prioritizeSeoTags>
      {/* Title et Description de base */}
      <title>{pageTitle}</title>
      <meta name="description" content={truncatedDescription} data-rh="true" />

      {/* Open Graph tags */}
      <meta property="og:title" content={pageTitle} data-rh="true" />
      <meta property="og:description" content={truncatedDescription} data-rh="true" />
      <meta property="og:type" content="website" data-rh="true" />
      <meta property="og:url" content={window.location.href} data-rh="true" />
      <meta property="og:site_name" content={agencyName || 'LYCS Immobilier'} data-rh="true" />
      
      {/* Image tags */}
      {firstPhotoUrl && (
        <>
          <meta property="og:image" content={absoluteImageUrl} data-rh="true" />
          <meta property="og:image:secure_url" content={absoluteImageUrl} data-rh="true" />
          <meta property="og:image:type" content="image/jpeg" data-rh="true" />
          <meta property="og:image:width" content="1200" data-rh="true" />
          <meta property="og:image:height" content="630" data-rh="true" />
          <meta property="og:image:alt" content={title} data-rh="true" />
        </>
      )}

      {/* Prix et détails */}
      <meta property="og:price:amount" content={price.toString()} data-rh="true" />
      <meta property="og:price:currency" content="FCFA" data-rh="true" />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" data-rh="true" />
      <meta name="twitter:title" content={pageTitle} data-rh="true" />
      <meta name="twitter:description" content={truncatedDescription} data-rh="true" />
      {firstPhotoUrl && (
        <meta name="twitter:image" content={absoluteImageUrl} data-rh="true" />
      )}
    </Helmet>
  );
}
