import React, { useState } from 'react';
import { Heart, Eye, MessageCircle, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const PropertyCard = ({ property, onLike, onViewDetails }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(property.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    onLike(property.id, !isLiked);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="relative">
        {/* Property Image */}
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onClick={() => onViewDetails(property.id)}
          />
          
          {/* Type Badge */}
          <Badge 
            className={`absolute top-3 left-3 ${
              property.type === 'sale' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {property.type === 'sale' ? 'Vente' : 'Location'}
          </Badge>

          {/* Like Button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-3 right-3 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
          >
            <Heart 
              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>
        </div>

        <CardContent className="p-4">
          {/* Price */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-orange-600">
              {formatPrice(property.price)}
              {property.type === 'rent' && <span className="text-sm text-gray-500">/mois</span>}
            </p>
          </div>

          {/* Title */}
          <h3 
            className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition-colors"
            onClick={() => onViewDetails(property.id)}
          >
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.location.neighborhood}, {property.location.city}</span>
          </div>

          {/* Property Details */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-4">
              {property.bedrooms > 0 && (
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              <div className="flex items-center">
                <Square className="h-4 w-4 mr-1" />
                <span>{property.area}m²</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>{property.views}</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                <span>{likes}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{property.comments.length}</span>
              </div>
            </div>
            <span className="text-xs">
              {new Date(property.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default PropertyCard;