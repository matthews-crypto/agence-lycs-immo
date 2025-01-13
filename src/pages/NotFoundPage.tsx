import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-8">
        La page que vous recherchez n'existe pas.
      </p>
      <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
    </div>
  );
}