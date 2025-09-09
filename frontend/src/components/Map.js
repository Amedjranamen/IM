import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker for property listings
const createCustomIcon = (color = '#2563eb') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to handle map clicks for placing markers
const MapClickHandler = ({ onMapClick, isPlacingMarker }) => {
  useMapEvents({
    click: (e) => {
      if (isPlacingMarker && onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });

  return null;
};

// Component to fit map bounds to markers
const FitBounds = ({ listings }) => {
  const map = useMap();

  useEffect(() => {
    if (listings && listings.length > 0) {
      const validListings = listings.filter(listing => listing.lat && listing.lon);
      if (validListings.length > 0) {
        const bounds = L.latLngBounds(
          validListings.map(listing => [listing.lat, listing.lon])
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [listings, map]);

  return null;
};

const Map = ({ 
  listings = [], 
  onMarkerClick, 
  onMapClick, 
  isPlacingMarker = false, 
  placedMarker = null,
  className = "",
  height = "400px",
  center = [0.4162, 9.4673], // Libreville, Gabon
  zoom = 10
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Update center if listings are provided
  useEffect(() => {
    if (listings && listings.length > 0) {
      const validListings = listings.filter(listing => listing.lat && listing.lon);
      if (validListings.length === 1) {
        setMapCenter([validListings[0].lat, validListings[0].lon]);
        setMapZoom(13);
      }
    }
  }, [listings]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' XAF';
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapClickHandler onMapClick={onMapClick} isPlacingMarker={isPlacingMarker} />
        <FitBounds listings={listings} />
        
        {/* Render listing markers */}
        {listings.map((listing) => 
          listing.lat && listing.lon ? (
            <Marker
              key={`listing-${listing.id}`}
              position={[listing.lat, listing.lon]}
              icon={createCustomIcon(listing.listing_type === 'sale' ? '#2563eb' : '#059669')}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(listing)
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{listing.title}</h3>
                  <p className="text-blue-600 font-bold text-lg">{formatPrice(listing.price)}</p>
                  <p className="text-gray-600 text-xs">
                    {listing.city}{listing.neighborhood && `, ${listing.neighborhood}`}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    {listing.surface && <span>{listing.surface} m²</span>}
                    {listing.rooms && <span>{listing.rooms} pièces</span>}
                    <span className={`px-2 py-1 rounded-full text-white text-xs ${
                      listing.listing_type === 'sale' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {listing.listing_type === 'sale' ? 'Vente' : 'Location'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
        
        {/* Render placed marker for new listings */}
        {placedMarker && (
          <Marker
            position={[placedMarker.lat, placedMarker.lng]}
            icon={createCustomIcon('#dc2626')}
          >
            <Popup>
              <div className="p-2">
                <p className="text-sm font-medium">Nouvelle annonce</p>
                <p className="text-xs text-gray-600">
                  Lat: {placedMarker.lat.toFixed(6)}, Lng: {placedMarker.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {isPlacingMarker && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium text-gray-700">
            📍 Cliquez sur la carte pour placer votre bien
          </p>
        </div>
      )}
    </div>
  );
};

export default Map;