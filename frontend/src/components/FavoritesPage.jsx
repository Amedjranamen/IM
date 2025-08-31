import React, { useState, useEffect } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import PropertyCard from './PropertyCard';
import { useApp } from '../contexts/AppContext';

const FavoritesPage = ({ onBack }) => {
  const [favorites, setFavorites] = useState([]);
  const { properties, likeProperty } = useApp();

  useEffect(() => {
    // Récupérer les favoris depuis le localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoriteProperties = properties.filter(property => 
      savedFavorites.includes(property.id)
    );
    setFavorites(favoriteProperties);
  }, [properties]);

  const handleLike = async (propertyId, isLiked) => {
    await likeProperty(propertyId, isLiked);
    
    // Mettre à jour les favoris dans localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isLiked) {
      if (!savedFavorites.includes(propertyId)) {
        savedFavorites.push(propertyId);
      }
    } else {
      const index = savedFavorites.indexOf(propertyId);
      if (index > -1) {
        savedFavorites.splice(index, 1);
      }
    }
    localStorage.setItem('favorites', JSON.stringify(savedFavorites));
    
    // Mettre à jour la liste des favoris
    const favoriteProperties = properties.filter(property => 
      savedFavorites.includes(property.id)
    );
    setFavorites(favoriteProperties);
  };

  const handleViewDetails = (propertyId) => {
    // Cette fonction sera gérée par le composant parent
    console.log('View details for property:', propertyId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-red-500" />
              Mes Favoris
            </h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length > 0 ? (
          <>
            <p className="text-gray-600 mb-6">
              Vous avez {favorites.length} propriété{favorites.length !== 1 ? 's' : ''} en favori{favorites.length !== 1 ? 's' : ''}.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {favorites.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onLike={handleLike}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Aucun favori pour le moment
            </h2>
            <p className="text-gray-600 mb-6">
              Parcourez les annonces et ajoutez vos propriétés préférées à vos favoris
            </p>
            <Button onClick={onBack} className="bg-orange-600 hover:bg-orange-700">
              Parcourir les annonces
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;