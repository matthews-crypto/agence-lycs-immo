
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
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Fix for the marker icon not showing
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(`map-${latitude}-${longitude}`).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add marker with custom popup
      markerRef.current = L.marker([latitude, longitude], { icon: defaultIcon })
        .addTo(mapRef.current)
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
        });

      // Open popup immediately after initialization
      markerRef.current.openPopup();

      // Simple toggle popup on click
      markerRef.current.on('click', function() {
        if (this.getPopup().isOpen()) {
          this.closePopup();
        } else {
          this.openPopup();
        }
      });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) return null;

  return (
    <div 
      id={`map-${latitude}-${longitude}`} 
      className={`h-full min-h-[300px] rounded-lg ${className}`}
      style={{ zIndex: 1 }} // Ensure map stays below the dialog
    />
  );
};

export default PropertyMap;
