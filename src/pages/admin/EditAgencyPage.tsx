import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditAgencyPage() {
  const { id } = useParams();
  
  const { data: agency, isLoading } = useQuery({
    queryKey: ["admin", "agencies", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Agence non trouvée</h1>
        <p className="text-muted-foreground">
          L'agence que vous cherchez n'existe pas ou a été supprimée.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">
        Modifier l'agence : {agency.agency_name}
      </h1>
      {/* Le formulaire de modification sera implémenté dans une prochaine étape */}
      <p className="text-muted-foreground">
        Le formulaire de modification sera bientôt disponible.
      </p>
    </div>
  );
}