import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar with #aa1ca0 background */}
      <nav style={{ backgroundColor: '#aa1ca0' }}>
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex-1" />
          <div className="flex-1 flex justify-center">
            <img 
              src="/lovable-uploads/684fe972-b658-43e2-b8cd-cd79ce781c45.png"
              alt="Logo"
              className="h-16 object-contain rounded-full" // Added rounded-full for circular logo
            />
          </div>
          <div className="flex-1 flex justify-end">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/auth")}
              className="flex items-center gap-2 text-white hover:text-white/80"
            >
              <span>Compte</span>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Homepage</h1>
        {/* Add your homepage content here */}
      </div>
    </div>
  );
}