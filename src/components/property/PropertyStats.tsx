
interface PropertyStatsProps {
  price: number;
  bedrooms: number;
  surfaceArea: number;
}

export default function PropertyStats({ 
  price, 
  bedrooms, 
  surfaceArea 
}: PropertyStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-gray-900">
          {price.toLocaleString()} FCFA
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-gray-900">
          {bedrooms} Pièces
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-gray-900">
          {surfaceArea} m²
        </p>
      </div>
    </div>
  );
}
