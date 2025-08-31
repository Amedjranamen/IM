import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import PropertyCard from "./components/PropertyCard";
import FilterSidebar from "./components/FilterSidebar";
import MapView from "./components/MapView";
import { mockProperties } from "./data/mock";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";

const Home = () => {
  const [properties, setProperties] = useState(mockProperties);
  const [filteredProperties, setFilteredProperties] = useState(mockProperties);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const { toast } = useToast();

  // Shuffle properties for random feed
  const shuffledProperties = useMemo(() => {
    return [...filteredProperties].sort(() => Math.random() - 0.5);
  }, [filteredProperties]);

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(property => property.type === filters.type);
    }

    if (filters.city && filters.city !== 'all') {
      filtered = filtered.filter(property => property.location.city === filters.city);
    }

    if (filters.neighborhood && filters.neighborhood !== 'all') {
      filtered = filtered.filter(property => property.location.neighborhood === filters.neighborhood);
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(property => property.category === filters.category);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price >= parseInt(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price <= parseInt(filters.maxPrice));
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms >= parseInt(filters.bedrooms));
    }

    if (filters.minArea) {
      filtered = filtered.filter(property => property.area >= parseInt(filters.minArea));
    }

    if (filters.maxArea) {
      filtered = filtered.filter(property => property.area <= parseInt(filters.maxArea));
    }

    if (filters.features && filters.features.length > 0) {
      filtered = filtered.filter(property =>
        filters.features.some(feature => property.features.includes(feature))
      );
    }

    setFilteredProperties(filtered);
  }, [searchTerm, filters, properties]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const handleLike = (propertyId, isLiked) => {
    setProperties(prev => 
      prev.map(property => 
        property.id === propertyId 
          ? { ...property, likes: isLiked ? property.likes + 1 : property.likes - 1 }
          : property
      )
    );

    toast({
      description: isLiked ? "Ajouté aux favoris" : "Retiré des favoris",
      duration: 2000,
    });
  };

  const handleViewDetails = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    
    toast({
      description: `Détails de "${property.title}"`,
      duration: 2000,
    });
  };

  const handlePropertySelect = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={handleSearch}
        onShowMap={() => setShowMap(!showMap)}
        showMap={showMap}
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1705858246897-70ecc1d42662?w=1920)'
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            IMMO&CO
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Votre plateforme immobilière au Gabon
          </p>
          <p className="text-lg opacity-80">
            Trouvez la propriété de vos rêves ou vendez votre bien en toute simplicité
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Hidden on map view */}
          {!showMap && (
            <div className="lg:w-80 space-y-6">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClear={handleClearFilters}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {showMap ? 'Carte des biens' : 'Biens immobiliers'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({shuffledProperties.length} résultat{shuffledProperties.length !== 1 ? 's' : ''})
                </span>
              </h2>
            </div>

            {/* Map or Grid View */}
            {showMap ? (
              <MapView
                properties={shuffledProperties}
                onPropertySelect={handlePropertySelect}
                onClose={() => setShowMap(false)}
                selectedProperty={selectedProperty}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {shuffledProperties.length > 0 ? (
                  shuffledProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onLike={handleLike}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg">
                      Aucun bien ne correspond à vos critères de recherche.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
