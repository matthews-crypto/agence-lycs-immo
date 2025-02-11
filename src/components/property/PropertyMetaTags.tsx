
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
  agencyName
}: PropertyMetaTagsProps) {
  const truncatedDescription = description
    ? description.length > 100
      ? `${description.substring(0, 100)}...`
      : description
    : "";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={truncatedDescription} />

      {/* Tags pour l'application */}
      {agencyName && (
        <>
          <meta property="application-name" content={agencyName} />
          <meta property="og:site_name" content={agencyName} />
        </>
      )}

      {/* Tags Open Graph de base */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:url" content={window.location.href} />

      {/* Tags d'image avec forçage HTTPS */}
      {photos?.[0] && (
        <>
          <meta property="og:image" content={getAbsoluteUrl(photos[0])} />
          <meta property="og:image:secure_url" content={getAbsoluteUrl(photos[0])} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={title} />
          <link rel="image_src" href={getAbsoluteUrl(photos[0])} />
        </>
      )}
      
      <meta property="og:price:amount" content={price.toString()} />
      <meta property="og:price:currency" content="FCFA" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      {photos?.[0] && (
        <meta name="twitter:image" content={getAbsoluteUrl(photos[0])} />
      )}
    </Helmet>
  );
}
