import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X, MapPin, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapLocationPicker = ({ onLocationSelect, onClose, initialCoordinates = [9.4536, 0.3955] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(initialCoordinates);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(initialCoordinates, 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add initial marker
    const marker = L.marker(initialCoordinates, {
      draggable: true
    }).addTo(map);
    markerRef.current = marker;

    // Handle marker drag
    marker.on('dragend', function(e) {
      const position = e.target.getLatLng();
      setSelectedCoordinates([position.lat, position.lng]);
      reverseGeocode(position.lat, position.lng);
    });

    // Handle map click
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setSelectedCoordinates([lat, lng]);
      reverseGeocode(lat, lng);
    });

    // Initial reverse geocoding
    reverseGeocode(initialCoordinates[0], initialCoordinates[1]);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error);
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleConfirm = () => {
    onLocationSelect(selectedCoordinates, address);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Sélectionner l'emplacement
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Cliquez sur la carte ou déplacez le marqueur pour sélectionner l'emplacement exact de votre propriété.
            </p>
          </div>

          {/* Adresse sélectionnée */}
          {address && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Adresse sélectionnée:</p>
              <p className="text-sm text-gray-600">{address}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coordonnées: {selectedCoordinates[0].toFixed(4)}, {selectedCoordinates[1].toFixed(4)}
              </p>
            </div>
          )}

          {/* Carte */}
          <div className="h-96 w-full rounded-lg overflow-hidden border">
            <div ref={mapRef} className="h-full w-full" />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} className="flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Confirmer l'emplacement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapLocationPicker;