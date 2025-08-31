import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Search, MapPin, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useApp } from '../contexts/AppContext';

// Fix for default markers in React + Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapSearch = ({ onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [isSearching, setIsSearching] = useState(false);

  const { loadProperties, cities } = useApp();

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Gabon
    mapInstanceRef.current = L.map(mapRef.current).setView([0.4162, 9.4673], 6);

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

  // Update markers when search results change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for search results
    searchResults.forEach(property => {
      if (property.location && property.location.coordinates) {
        const [lat, lng] = property.location.coordinates;
        
        // Custom marker with property type color
        const markerColor = property.type === 'sale' ? '#16a34a' : '#2563eb';
        
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${markerColor};
              width: 35px;
              height: 35px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">
              <span style="margin-top: -2px;">
                ${property.type === 'sale' ? '€' : '⌂'}
              </span>
            </div>
          `,
          iconSize: [35, 35],
          iconAnchor: [17.5, 17.5]
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
          <div style="min-width: 280px;">
            <img src="${property.images[0]}" alt="${property.title}" 
                 style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;" />
            <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; line-height: 1.4;">
              ${property.title}
            </h3>
            <p style="margin: 0 0 10px 0; color: #f97316; font-weight: bold; font-size: 18px;">
              ${formatPrice(property.price)}
              ${property.type === 'rent' ? '/mois' : ''}
            </p>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">
              📍 ${property.location.neighborhood}, ${property.location.city}
            </p>
            <div style="margin: 10px 0; font-size: 13px; color: #666; display: flex; gap: 15px;">
              ${property.bedrooms > 0 ? `🛏️ ${property.bedrooms} ch.` : ''} 
              ${property.bathrooms > 0 ? `🚿 ${property.bathrooms} sdb` : ''} 
              📐 ${property.area}m²
            </div>
            <button onclick="window.viewProperty('${property.id}')" 
                    style="
                      background: #f97316; 
                      color: white; 
                      border: none; 
                      padding: 8px 16px; 
                      border-radius: 6px; 
                      cursor: pointer; 
                      font-size: 13px;
                      width: 100%;
                      margin-top: 10px;
                      font-weight: 500;
                    ">
              Voir les détails
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      }
    });

    // Fit map to show all markers if there are results
    if (searchResults.length > 0 && markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    // Set up global function for property viewing
    window.viewProperty = (propertyId) => {
      window.open(`/property/${propertyId}`, '_blank');
    };

    return () => {
      window.viewProperty = null;
    };
  }, [searchResults]);

  const handleSearch = async () => {
    setIsSearching(true);
    
    const filters = {};
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    if (selectedCity && selectedCity !== 'all') {
      filters.city = selectedCity;
    }
    
    if (selectedType && selectedType !== 'all') {
      filters.type = selectedType;
    }
    
    if (priceRange.min) {
      filters.min_price = parseInt(priceRange.min);
    }
    
    if (priceRange.max) {
      filters.max_price = parseInt(priceRange.max);
    }

    try {
      const results = await loadProperties(filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedType('all');
    setPriceRange({ min: '', max: '' });
    setSearchResults([]);
    
    // Clear markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];
    
    // Reset map view
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([0.4162, 9.4673], 6);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Search className="h-6 w-6 mr-3 text-orange-600" />
            Recherche avancée sur carte
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Controls */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Rechercher (ville, quartier, type...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="sale">Vente</SelectItem>
                  <SelectItem value="rent">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Input
                type="number"
                placeholder="Prix min (XAF)"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              />
            </div>
            
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Prix max (XAF)"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleClearSearch}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="px-6 py-3 bg-white border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm">Vente</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-sm">Location</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''} trouvé{searchResults.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default MapSearch;