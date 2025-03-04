
import { useState, useEffect, useRef } from "react";
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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from "sonner";

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
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  // Initialize or reinitialize the map when the sidebar opens
  useEffect(() => {
    if (!open) return;

    console.log("FilterSidebar opened, initializing map...");
    
    // Clean up previous map instance if it exists
    if (mapRef.current) {
      console.log("Removing existing map");
      mapRef.current.remove();
      mapRef.current = null;
      setMapInitialized(false);
    }

    // Wait for the DOM to be ready
    setTimeout(() => {
      if (!mapContainerRef.current) {
        console.log("Map container ref not available");
        return;
      }

      try {
        console.log("Creating new map instance");
        // Create the map with a default view of Senegal
        const map = L.map(mapContainerRef.current, {
          scrollWheelZoom: false, // Disable scroll to zoom for better UX in a small container
          zoomControl: true,      // Add zoom controls
        }).setView([14.7167, -17.4677], 7);
        
        // Add the OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Store the map in the ref
        mapRef.current = map;
        setMapInitialized(true);
        console.log("Map initialized successfully");

        // Force map to recalculate its container size
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            console.log("Map size invalidated");
          }
        }, 300);
      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("Erreur lors de l'initialisation de la carte");
      }
    }, 300); // Short delay to ensure the container is rendered

    // Cleanup function
    return () => {
      if (circleRef.current && mapRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    };
  }, [open]);

  // Update map when a zone is selected
  useEffect(() => {
    if (!mapRef.current || !zones || zones.length === 0 || !selectedZone || !mapInitialized) {
      console.log("Skipping zone update on map, conditions not met:", {
        mapExists: !!mapRef.current,
        zonesExist: !!(zones && zones.length > 0),
        zoneSelected: !!selectedZone,
        mapInitialized
      });
      return;
    }

    console.log("Updating map with selected zone:", selectedZone);

    // Clear existing circle
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    // Find selected zone
    const selectedZoneData = zones.find(zone => zone.id === selectedZone);
    if (!selectedZoneData || !selectedZoneData.latitude || !selectedZoneData.longitude) {
      console.log("Selected zone data is invalid:", selectedZoneData);
      return;
    }

    console.log("Found zone data:", selectedZoneData);

    try {
      // Create new circle with the selected zone's coordinates and radius
      const center: L.LatLngExpression = [Number(selectedZoneData.latitude), Number(selectedZoneData.longitude)];
      
      const newCircle = L.circle(center, {
        radius: selectedZoneData.circle_radius || 5000,
        color: '#AA1CA0',
        fillColor: '#AA1CA0',
        fillOpacity: 0.3,
        weight: 2
      }).addTo(mapRef.current);

      // Add a marker at the center
      L.marker(center).addTo(mapRef.current)
        .bindPopup(selectedZoneData.nom)
        .openPopup();

      // Set the current circle to the ref for future cleanup
      circleRef.current = newCircle;
      
      // Center map on selected zone and zoom appropriately
      mapRef.current.setView(center, 11);
      mapRef.current.invalidateSize();
      
      console.log("Map updated successfully with zone:", selectedZoneData.nom);
    } catch (error) {
      console.error("Error updating map with zone:", error);
      toast.error("Erreur lors de l'affichage de la zone sur la carte");
    }
  }, [mapRef.current, zones, selectedZone, mapInitialized]);

  // Make sure map size is correct after the sidebar animation completes
  useEffect(() => {
    if (open && mapRef.current && mapInitialized) {
      const resizeTimeout = setTimeout(() => {
        mapRef.current?.invalidateSize();
        console.log("Map size invalidated after animation");
      }, 500);
      
      return () => clearTimeout(resizeTimeout);
    }
  }, [open, mapInitialized]);

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(parseInt(regionId));
    setSelectedZone(null);
    if (circleRef.current && mapRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
      mapRef.current.setView([14.7167, -17.4677], 7); // Reset to Dakar
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
    if (circleRef.current && mapRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
      mapRef.current.setView([14.7167, -17.4677], 7); // Reset to Dakar
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

          <div 
            ref={mapContainerRef} 
            className="w-full h-[300px] rounded-lg mt-4 border"
            style={{ zIndex: 0 }}
          ></div>

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
