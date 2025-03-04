
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from "sonner";

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  radius?: number | null;
  className?: string;
}

const PropertyMap = ({ latitude, longitude, radius = 5000, className = "" }: PropertyMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const mapId = `map-${latitude || 'default'}-${longitude || 'default'}-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Clean up previous instance if it exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    try {
      console.log("Initializing property map with coordinates:", { latitude, longitude, radius });
      
      // Initialize new map instance
      const mapInstance = L.map(mapId, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([latitude, longitude], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      mapRef.current = mapInstance;

      // Add circle with radius
      circleRef.current = L.circle([latitude, longitude], {
        color: '#0066FF',
        fillColor: '#0066FF',
        fillOpacity: 0.2,
        radius: radius // in meters
      }).addTo(mapInstance);

      // Add a center marker
      L.circleMarker([latitude, longitude], {
        color: '#0066FF',
        fillColor: '#0066FF',
        fillOpacity: 1,
        radius: 5
      }).addTo(mapInstance)
        .bindPopup(`
          <div style="text-align: center;">
            <a 
              href="https://www.google.com/maps?q=${latitude},${longitude}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="
                display: inline-block;
                padding: 8px 16px;
                background-color: #0066FF;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                margin: 8px 0;
              "
            >
              Voir sur Google Maps
            </a>
          </div>
        `, {
          closeButton: false
        })
        .openPopup();

      // Fit bounds to circle
      if (circleRef.current) {
        mapInstance.fitBounds(circleRef.current.getBounds());
      }

      // Force a resize after a short delay to ensure proper rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          console.log("Property map size invalidated");
        }
      }, 300);

    } catch (error) {
      console.error("Error initializing property map:", error);
      toast.error("Erreur lors de l'initialisation de la carte");
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    };
  }, [latitude, longitude, radius, mapId]);

  if (!latitude || !longitude) return null;

  return (
    <div 
      id={mapId} 
      className={`h-full min-h-[300px] rounded-lg ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

export default PropertyMap;
