import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AgencyHomePage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: agency?.primary_color || '#ffffff',
        color: agency?.secondary_color || '#000000'
      }}
    >
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          {agency?.logo_url && (
            <img 
              src={agency.logo_url} 
              alt={agency.agency_name} 
              className="h-16 object-contain"
            />
          )}
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate(`/${agency?.slug}/auth`)}
              style={{
                backgroundColor: agency?.secondary_color || '#000000',
                color: agency?.primary_color || '#ffffff'
              }}
            >
              Se connecter
            </Button>
            <Button 
              onClick={() => navigate(`/${agency?.slug}/register`)}
              variant="outline"
              style={{
                borderColor: agency?.secondary_color || '#000000',
                color: agency?.secondary_color || '#000000'
              }}
            >
              S'inscrire
            </Button>
          </div>
        </div>

        <div className="text-center mt-20">
          <h1 className="text-4xl font-bold mb-4">
            Bienvenue chez {agency?.agency_name}
          </h1>
          {agency?.description && (
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {agency.description}
            </p>
          )}
          <div className="flex justify-center gap-6">
            <Button 
              onClick={() => navigate(`/${agency?.slug}/properties`)}
              className="text-lg px-8 py-6"
              style={{
                backgroundColor: agency?.secondary_color || '#000000',
                color: agency?.primary_color || '#ffffff'
              }}
            >
              Voir nos biens
            </Button>
            <Button 
              onClick={() => navigate(`/${agency?.slug}/register`)}
              className="text-lg px-8 py-6"
              variant="outline"
              style={{
                borderColor: agency?.secondary_color || '#000000',
                color: agency?.secondary_color || '#000000'
              }}
            >
              Devenir client
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}