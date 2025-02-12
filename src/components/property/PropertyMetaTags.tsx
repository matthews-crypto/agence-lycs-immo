
import { Helmet } from "react-helmet-async";
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
  agencyName = 'LYCS Immobilier'
}: PropertyMetaTagsProps) {
  const formattedTitle = `${title} | ${agencyName}`;
  const truncatedDescription = description.length > 160 
    ? `${description.substring(0, 157)}...` 
    : description;
  
  const imageUrl = photos?.[0] ? getAbsoluteUrl(photos[0]) : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={truncatedDescription} />

      {/* Open Graph Meta Tags (Facebook) */}
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={agencyName} />
      <meta property="og:price:amount" content={price.toString()} />
      <meta property="og:price:currency" content="FCFA" />
      
      {imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:secure_url" content={imageUrl} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={title} />
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
    </Helmet>
  );
}
