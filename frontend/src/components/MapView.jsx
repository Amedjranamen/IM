import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, MapPin } from 'lucide-react';

// Fix for default markers in React + Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ properties, onPropertySelect, onClose, selectedProperty }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Libreville, Gabon
    mapInstanceRef.current = L.map(mapRef.current).setView([9.4536, 0.3955], 11);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !properties) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for each property
    properties.forEach(property => {
      if (property.location && property.location.coordinates) {
        const [lat, lng] = property.location.coordinates;
        
        // Custom marker with property type color
        const markerColor = property.type === 'sale' ? '#16a34a' : '#2563eb';
        
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${markerColor};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
            ">
              <span style="margin-top: -2px;">
                ${property.type === 'sale' ? '€' : '⌂'}
              </span>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapInstanceRef.current);

        // Popup content
        const formatPrice = (price) => {
          return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
          }).format(price);
        };

        const popupContent = `
          <div style="min-width: 250px;">
            <img src="${property.images[0]}" alt="${property.title}" 
                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; line-height: 1.3;">
              ${property.title}
            </h3>
            <p style="margin: 0 0 8px 0; color: #f97316; font-weight: bold; font-size: 16px;">
              ${formatPrice(property.price)}
              ${property.type === 'rent' ? '/mois' : ''}
            </p>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">
              📍 ${property.location.neighborhood}, ${property.location.city}
            </p>
            <div style="margin: 8px 0; font-size: 12px; color: #666;">
              ${property.bedrooms > 0 ? `🛏️ ${property.bedrooms} ch.` : ''} 
              ${property.bathrooms > 0 ? `🚿 ${property.bathrooms} sdb` : ''} 
              📐 ${property.area}m²
            </div>
            <button onclick="window.selectProperty('${property.id}')" 
                    style="
                      background: #f97316; 
                      color: white; 
                      border: none; 
                      padding: 6px 12px; 
                      border-radius: 4px; 
                      cursor: pointer; 
                      font-size: 12px;
                      width: 100%;
                      margin-top: 8px;
                    ">
              Voir les détails
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);

        // Highlight selected property
        if (selectedProperty && selectedProperty.id === property.id) {
          marker.openPopup();
        }
      }
    });

    // Set up global function for property selection
    window.selectProperty = (propertyId) => {
      onPropertySelect(propertyId);
    };

    return () => {
      window.selectProperty = null;
    };
  }, [properties, selectedProperty, onPropertySelect]);

  return (
    <Card className="relative h-full">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          className="bg-white/90 hover:bg-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 rounded-lg p-3 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              <span>Vente</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span>Location</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '600px' }}
      />
    </Card>
  );
};

export default MapView;