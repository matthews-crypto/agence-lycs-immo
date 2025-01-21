import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Link to={`/${params.slug}/properties/${params.id}/images`}>
          <Button className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Gérer les images
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-4">{property?.title}</h1>
        <p className="text-gray-600">{property?.description}</p>
        {/* Add more property details as needed */}
      </div>
    </div>
  );
}