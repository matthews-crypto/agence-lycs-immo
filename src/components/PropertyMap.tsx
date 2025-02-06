
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  className?: string;
}

const PropertyMap = ({ latitude, longitude, className = "" }: PropertyMapProps) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(`map-${latitude}-${longitude}`).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add marker
      L.marker([latitude, longitude]).addTo(mapRef.current);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) return null;

  return (
    <div 
      id={`map-${latitude}-${longitude}`} 
      className={`h-full min-h-[300px] rounded-lg ${className}`}
    />
  );
};

export default PropertyMap;
