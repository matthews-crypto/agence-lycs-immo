
interface SimilarPropertyProps {
  id: string;
  title: string;
  photos: string[];
  price: number;
  bedrooms: number;
  surfaceArea: number;
  region: string;
  propertyOfferType: string;
  primaryColor?: string;
  onClick: (id: string) => void;
}

interface SimilarPropertiesProps {
  properties: SimilarPropertyProps[];
  agencyPrimaryColor?: string;
}

export default function SimilarProperties({ 
  properties,
  agencyPrimaryColor
}: SimilarPropertiesProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Biens Similaires</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => (
          <div
            key={prop.id}
            onClick={() => prop.onClick(prop.id)}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <img
                src={prop.photos?.[0]}
                alt={prop.title}
                className="w-full h-48 object-cover"
              />
              <div 
                className="absolute top-4 right-4 px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: agencyPrimaryColor }}
              >
                {prop.propertyOfferType === 'VENTE' ? 'À Vendre' : 'À Louer'}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{prop.title}</h3>
              <div className="flex justify-between items-center text-gray-600 mb-2">
                <span>{prop.price.toLocaleString()} FCFA</span>
                <span>•</span>
                <span>{prop.bedrooms} Pièces</span>
                <span>•</span>
                <span>{prop.surfaceArea} m²</span>
              </div>
              <p style={{ color: agencyPrimaryColor }}>{prop.region}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
