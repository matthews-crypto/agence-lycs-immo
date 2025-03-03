
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  radius?: number | null;
  className?: string;
}

const PropertyMap = ({ latitude, longitude, radius = 5000, className = "" }: PropertyMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(`map-${latitude}-${longitude}`).setView([latitude, longitude], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add circle with radius
      circleRef.current = L.circle([latitude, longitude], {
        color: '#0066FF',
        fillColor: '#0066FF',
        fillOpacity: 0.2,
        radius: radius // in meters
      }).addTo(mapRef.current);

      // Add a small center marker
      L.circleMarker([latitude, longitude], {
        color: '#0066FF',
        fillColor: '#0066FF',
        fillOpacity: 1,
        radius: 5
      }).addTo(mapRef.current)
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
        mapRef.current.fitBounds(circleRef.current.getBounds());
      }
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
  }, [latitude, longitude, radius]);

  if (!latitude || !longitude) return null;

  return (
    <div 
      id={`map-${latitude}-${longitude}`} 
      className={`h-full min-h-[300px] rounded-lg ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

export default PropertyMap;
