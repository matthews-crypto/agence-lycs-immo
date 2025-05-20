
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PropertyHeaderProps {
  onBack: () => void;
  agencyLogo?: string;
  agencyName?: string;
  primaryColor?: string;
}

export default function PropertyHeader({ 
  onBack, 
  agencyLogo, 
  agencyName,
  primaryColor 
}: PropertyHeaderProps) {
  return (
    <div 
      className="w-full h-16 flex items-center px-4 relative"
      style={{ backgroundColor: primaryColor || '#0066FF' }}
    >
      <Button
        variant="ghost"
        className="absolute left-4 text-white hover:text-white/80"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
      <div className="flex-1 flex justify-center items-center">
        {agencyLogo ? (
          <img 
            src={agencyLogo} 
            alt={agencyName} 
            className="h-10 object-contain rounded-full bg-white p-1"
          />
        ) : (
          <span className="text-white text-lg font-semibold">
            {agencyName}
          </span>
        )}
      </div>
    </div>
  );
}
