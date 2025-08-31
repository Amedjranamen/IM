import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { mockCities, mockCategories, mockFeatures } from '../data/mock';

const FilterSidebar = ({ filters, onFiltersChange, onClear, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleFeatureToggle = (feature) => {
    const currentFeatures = filters.features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    handleFilterChange('features', newFeatures);
  };

  return (
    <Card className={`h-fit ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2" />
            Filtres
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-orange-600 hover:text-orange-700"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Type de transaction */}
          <div>
            <label className="text-sm font-medium mb-3 block">Type de transaction</label>
            <Select 
              value={filters.type || ""} 
              onValueChange={(value) => handleFilterChange('type', value)}
            >
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

          {/* Ville */}
          <div>
            <label className="text-sm font-medium mb-3 block">Ville</label>
            <Select 
              value={filters.city || ""} 
              onValueChange={(value) => handleFilterChange('city', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {mockCities.map(city => (
                  <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quartier */}
          {filters.city && (
            <div>
              <label className="text-sm font-medium mb-3 block">Quartier</label>
              <Select 
                value={filters.neighborhood || ""} 
                onValueChange={(value) => handleFilterChange('neighborhood', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les quartiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les quartiers</SelectItem>
                  {mockCities
                    .find(city => city.name === filters.city)
                    ?.neighborhoods.map(neighborhood => (
                      <SelectItem key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Catégorie */}
          <div>
            <label className="text-sm font-medium mb-3 block">Catégorie</label>
            <Select 
              value={filters.category || ""} 
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                {mockCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prix */}
          <div>
            <label className="text-sm font-medium mb-3 block">Prix (XAF)</label>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Nombre de chambres */}
          <div>
            <label className="text-sm font-medium mb-3 block">Chambres</label>
            <Select 
              value={filters.bedrooms || ""} 
              onValueChange={(value) => handleFilterChange('bedrooms', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nombre de chambres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Surface */}
          <div>
            <label className="text-sm font-medium mb-3 block">Surface (m²)</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minArea || ""}
                onChange={(e) => handleFilterChange('minArea', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxArea || ""}
                onChange={(e) => handleFilterChange('maxArea', e.target.value)}
              />
            </div>
          </div>

          {/* Équipements */}
          <div>
            <label className="text-sm font-medium mb-3 block">Équipements</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {mockFeatures.map(feature => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={(filters.features || []).includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
                  />
                  <label htmlFor={feature} className="text-sm cursor-pointer">
                    {feature}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default FilterSidebar;