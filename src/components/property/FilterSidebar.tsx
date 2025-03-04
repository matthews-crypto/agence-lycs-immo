
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { MapPin, X, Filter, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

type RegionType = {
  id: number;
  nom: string;
};

type ZoneType = {
  id: number;
  nom: string;
  region_id: number;
  latitude: number;
  longitude: number;
  circle_radius: number;
};

interface FilterSidebarProps {
  agencyId?: string;
  onFilterApply: (selectedRegion: number | null, selectedZone: number | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterSidebar({ agencyId, onFilterApply, open, onOpenChange }: FilterSidebarProps) {
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoneCircle, setZoneCircle] = useState<google.maps.Circle | null>(null);

  // Fetch all regions
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("region")
        .select("*")
        .order("nom");

      if (error) throw error;
      return data as RegionType[];
    },
  });

  // Fetch zones based on selected region and agency properties
  const { data: zones } = useQuery({
    queryKey: ["agency-zones", selectedRegion, agencyId],
    queryFn: async () => {
      if (!selectedRegion || !agencyId) return [];

      // Fetch unique zones that have properties for this agency
      const { data: agencyProperties, error: propertiesError } = await supabase
        .from("properties")
        .select("zone_id")
        .eq("agency_id", agencyId)
        .eq("is_available", true);

      if (propertiesError) throw propertiesError;

      // Extract unique zone IDs
      const zoneIds = [...new Set(agencyProperties.map(p => p.zone_id).filter(Boolean))];
      
      if (zoneIds.length === 0) return [];

      // Fetch zone details
      const { data: zoneData, error: zoneError } = await supabase
        .from("zone")
        .select("*")
        .eq("region_id", selectedRegion)
        .in("id", zoneIds)
        .order("nom");

      if (zoneError) throw zoneError;
      return zoneData as ZoneType[];
    },
    enabled: !!selectedRegion && !!agencyId,
  });

  // Initialize Google Maps
  useEffect(() => {
    if (!open || mapInitialized) return;

    const initMap = () => {
      const mapElement = document.getElementById("filter-map");
      if (!mapElement) return;

      const mapOptions = {
        center: { lat: 14.7167, lng: -17.4677 }, // Dakar, Senegal as default
        zoom: 7,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      };

      const newMap = new google.maps.Map(mapElement, mapOptions);
      setMap(newMap);
      setMapInitialized(true);
    };

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Script already added, just wait for it to load
      const checkGoogleMapsLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMapsLoaded);
          initMap();
        }
      }, 100);

      // Clean up
      return () => clearInterval(checkGoogleMapsLoaded);
    }
  }, [open, mapInitialized]);

  // Update map when a zone is selected
  useEffect(() => {
    if (!map || !zones || zones.length === 0 || !selectedZone) return;

    // Clear existing circle
    if (zoneCircle) {
      zoneCircle.setMap(null);
    }

    // Find selected zone
    const selectedZoneData = zones.find(zone => zone.id === selectedZone);
    if (!selectedZoneData || !selectedZoneData.latitude || !selectedZoneData.longitude) return;

    // Create new circle
    const center = { 
      lat: Number(selectedZoneData.latitude), 
      lng: Number(selectedZoneData.longitude) 
    };
    
    const newCircle = new google.maps.Circle({
      map,
      center,
      radius: selectedZoneData.circle_radius || 5000,
      fillColor: "#AA1CA0",
      fillOpacity: 0.3,
      strokeColor: "#AA1CA0",
      strokeOpacity: 0.8,
      strokeWeight: 2
    });

    setZoneCircle(newCircle);

    // Center map on selected zone
    map.setCenter(center);
    map.setZoom(11);
  }, [map, zones, selectedZone]);

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(parseInt(regionId));
    setSelectedZone(null);
    if (zoneCircle) {
      zoneCircle.setMap(null);
      setZoneCircle(null);
    }
  };

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(parseInt(zoneId));
  };

  const handleApplyFilters = () => {
    onFilterApply(selectedRegion, selectedZone);
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    setSelectedRegion(null);
    setSelectedZone(null);
    if (zoneCircle) {
      zoneCircle.setMap(null);
      setZoneCircle(null);
    }
    if (map) {
      map.setCenter({ lat: 14.7167, lng: -17.4677 }); // Reset to Dakar
      map.setZoom(7);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[90vw] sm:w-[400px] p-0 overflow-y-auto">
        <SheetHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtrer par région et zone
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="region">Région</Label>
            <Select 
              value={selectedRegion?.toString() || ""} 
              onValueChange={handleRegionChange}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Sélectionnez une région" />
              </SelectTrigger>
              <SelectContent>
                {regions?.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedRegion && zones && zones.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select 
                value={selectedZone?.toString() || ""} 
                onValueChange={handleZoneChange}
              >
                <SelectTrigger id="zone">
                  <SelectValue placeholder="Sélectionnez une zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedRegion && (!zones || zones.length === 0) && (
            <div className="text-sm text-muted-foreground">
              Aucune zone disponible pour cette région
            </div>
          )}

          <div id="filter-map" className="w-full h-[200px] rounded-lg mt-4"></div>

          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleApplyFilters}
              className="w-full gap-2"
            >
              <Check className="h-4 w-4" />
              Appliquer les filtres
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              className="w-full"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
