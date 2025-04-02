import { Helmet } from "react-helmet-async";
import { getAbsoluteUrl } from "@/utils/urlUtils";

interface PropertyMetaTagsProps {
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly photos?: string[];
  readonly address?: string;
}

export default function PropertyMetaTags({
  title,
  description,
  price,
  photos,
  address
}: PropertyMetaTagsProps) {
  let truncatedDescription = "";
  if (description) {
    truncatedDescription = description.length > 100
      ? `${description.substring(0, 100)}...`
      : description;
  }
    
  const formattedPrice = new Intl.NumberFormat('fr-FR').format(price);
  let propertyInfo = `${title} - ${formattedPrice} FCFA`;
  if (address) {
    propertyInfo = `${propertyInfo} - ${address}`;
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={truncatedDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={propertyInfo} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:url" content={window.location.href} />
      {photos?.[0] && (
        <>
          <meta property="og:image" content={getAbsoluteUrl(photos[0])} />
          <meta property="og:image:secure_url" content={getAbsoluteUrl(photos[0])} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={title} />
        </>
      )}
      <meta property="og:price:amount" content={price.toString()} />
      <meta property="og:price:currency" content="FCFA" />
      {address && <meta property="og:locality" content={address} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={propertyInfo} />
      <meta name="twitter:description" content={truncatedDescription} />
      {photos?.[0] && (
        <meta name="twitter:image" content={getAbsoluteUrl(photos[0])} />
      )}
      
      {/* WhatsApp specific */}
      <meta property="og:site_name" content="Agence LYCS Immo" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Additional meta tags for better previews */}
      <meta name="theme-color" content="#0066FF" />
      <meta name="author" content="Agence LYCS Immo" />
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}
