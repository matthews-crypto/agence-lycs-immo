
import { Helmet } from "react-helmet-async";
import { getAbsoluteUrl } from "@/utils/urlUtils";
import { getPrerenderUrl, shouldPrerender } from "@/middleware/prerenderMiddleware";

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
      <meta name="description" content={truncatedDescription} />

      {/* Open Graph tags */}
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
