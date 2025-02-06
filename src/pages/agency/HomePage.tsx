import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, BedDouble } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const propertyTypes = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "LAND", label: "Terrain" },
  { value: "COMMERCIAL", label: "Local commercial" },
  { value: "OFFICE", label: "Bureau" },
  { value: "OTHER", label: "Autre" },
];

export default function AgencyHomePage() {
  const { slug } = useParams();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");

  const { data: agency } = useQuery({
    queryKey: ["agency", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("region")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  const { data: properties } = useQuery({
    queryKey: ["agency-properties", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("agency_id", agency?.id)
        .eq("is_available", true);

      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  const filteredProperties = properties?.filter(property => {
    const matchesRegion = selectedRegion === "all" || property.region_id === parseInt(selectedRegion);
    const matchesCity = selectedCity === "all" || property.city === selectedCity;
    const matchesType = selectedType === "all" || property.property_type === selectedType;
    const matchesMinBudget = !minBudget || property.price >= parseInt(minBudget);
    const matchesMaxBudget = !maxBudget || property.price <= parseInt(maxBudget);
    return matchesRegion && matchesCity && matchesType && matchesMinBudget && matchesMaxBudget;
  });

  const cities = [...new Set(properties?.map(p => p.city).filter(Boolean))];

  const handleSearch = () => {
    if (!selectedCity && !minBudget && !maxBudget && selectedRegion === "all" && selectedType === "all") {
      toast.warning("Veuillez sélectionner au moins un critère de recherche");
      return;
    }
    toast.success("Recherche effectuée avec succès");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-gray-900">
        {agency?.logo_url && (
          <img
            src={agency.logo_url}
            alt={agency.agency_name}
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-light mb-4">
              {agency?.agency_name}
            </h1>
            <p className="text-xl text-white/80">
              Découvrez nos biens immobiliers
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-4">
          <Select 
            value={selectedRegion} 
            onValueChange={setSelectedRegion}
          >
            <SelectTrigger className="w-full md:w-[200px] text-base font-medium">
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-base">Régions</SelectItem>
              {regions?.map((region) => (
                <SelectItem key={region.id} value={region.id.toString()} className="text-base">
                  {region.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedCity} 
            onValueChange={setSelectedCity}
          >
            <SelectTrigger className="w-full md:w-[200px] text-base font-medium">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-base">Villes</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city} className="text-base">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedType} 
            onValueChange={setSelectedType}
          >
            <SelectTrigger className="w-full md:w-[200px] text-base font-medium">
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-base">Types</SelectItem>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-base">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <input
              type="number"
              placeholder="Budget min"
              className="flex-1 px-3 py-2 border rounded-md text-base font-medium"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
            />
            <input
              type="number"
              placeholder="Budget max"
              className="flex-1 px-3 py-2 border rounded-md text-base font-medium"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            />
          </div>

          <Button 
            className="w-full md:w-auto px-8"
            style={{
              backgroundColor: agency?.primary_color || '#000000',
            }}
            onClick={handleSearch}
          >
            Rechercher
          </Button>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties?.map((property) => (
            <div key={property.id} className="group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden rounded-lg">
                {property.photos?.[0] ? (
                  <img
                    src={property.photos[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <BedDouble className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-light">{property.title}</h3>
                <div className="flex items-center gap-2 text-gray-600 mt-2">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm">{property.city}</p>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-lg font-medium" style={{ color: agency?.primary_color }}>
                    {property.price.toLocaleString('fr-FR')} FCFA
                  </p>
                  <div className="flex items-center gap-1 text-gray-600">
                    <span>{property.surface_area} m²</span>
                    {property.bedrooms && (
                      <div className="flex items-center gap-1 ml-2">
                        <BedDouble className="w-4 h-4" />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}