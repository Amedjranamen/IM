import React, { useState, useEffect } from 'react';
import { MapPin, Upload, X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useApp } from '../contexts/AppContext';
import MapLocationPicker from './MapLocationPicker';

const PropertyForm = ({ property = null, onSubmit, onCancel }) => {
  const { cities, getNeighborhoods, createProperty, updateProperty } = useApp();
  const [loading, setLoading] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [showMap, setShowMap] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    type: 'sale',
    category: 'Villa',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    location: {
      city: '',
      neighborhood: '',
      coordinates: [9.4536, 0.3955] // Default to Libreville
    },
    images: [],
    description: '',
    features: [],
    seller: {
      name: '',
      phone: '',
      email: ''
    }
  });

  const [newFeature, setNewFeature] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const categories = ['Villa', 'Maison', 'Appartement', 'Studio', 'Terrain', 'Bureau', 'Commerce'];
  const commonFeatures = [
    'Climatisation', 'Jardin', 'Parking', 'Sécurité', 'Piscine', 'Garage', 
    'Balcon', 'Ascenseur', 'Meublé', 'WiFi', 'Véranda', 'Portail électrique',
    'Viabilisé', 'Titre foncier', 'Zone résidentielle', 'Accès bitumé'
  ];

  // Charger les données de la propriété si en mode édition
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        price: property.price?.toString() || '',
        type: property.type || 'sale',
        category: property.category || 'Villa',
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        area: property.area?.toString() || '',
        location: property.location || {
          city: '',
          neighborhood: '',
          coordinates: [9.4536, 0.3955]
        },
        images: property.images || [],
        description: property.description || '',
        features: property.features || [],
        seller: property.seller || {
          name: '',
          phone: '',
          email: ''
        }
      });
    }
  }, [property]);

  // Charger les quartiers quand la ville change
  useEffect(() => {
    if (formData.location.city) {
      loadNeighborhoods(formData.location.city);
    } else {
      setNeighborhoods([]);
    }
  }, [formData.location.city]);

  const loadNeighborhoods = async (city) => {
    try {
      const cityNeighborhoods = await getNeighborhoods(city);
      setNeighborhoods(cityNeighborhoods);
    } catch (error) {
      console.error('Erreur lors du chargement des quartiers:', error);
      setNeighborhoods([]);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLocationSelect = (coordinates, address) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates
      }
    }));
    setShowMap(false);
  };

  const addFeature = (feature = null) => {
    const featureToAdd = feature || newFeature.trim();
    if (featureToAdd && !formData.features.includes(featureToAdd)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureToAdd]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Convert file to base64 or handle file upload
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target.result;
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, imageDataUrl]
          }));
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const removeImage = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const propertyData = {
        ...formData,
        price: parseInt(formData.price),
        area: parseInt(formData.area),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms)
      };

      let result;
      if (property) {
        result = await updateProperty(property.id, propertyData);
      } else {
        result = await createProperty(propertyData);
      }

      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {property ? 'Modifier la propriété' : 'Publier une nouvelle propriété'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre de l'annonce *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Villa moderne 4 chambres - Libreville Centre"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Prix (XAF) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="Ex: 85000000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type de transaction *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Vente</SelectItem>
                      <SelectItem value="rent">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Chambres</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Salles de bain</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="area">Surface (m²) *</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="Ex: 250"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Select value={formData.location.city} onValueChange={(value) => handleInputChange('location.city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.location.city && (
                  <div>
                    <Label htmlFor="neighborhood">Quartier *</Label>
                    <Select value={formData.location.neighborhood} onValueChange={(value) => handleInputChange('location.neighborhood', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un quartier" />
                      </SelectTrigger>
                      <SelectContent>
                        {neighborhoods.map(neighborhood => (
                          <SelectItem key={neighborhood} value={neighborhood}>{neighborhood}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Localisation sur carte */}
            <div>
              <Label>Localisation précise</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(true)}
                  className="flex items-center"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Placer sur la carte
                </Button>
                {formData.location.coordinates && (
                  <span className="text-sm text-gray-500">
                    Coordonnées: {formData.location.coordinates[0].toFixed(4)}, {formData.location.coordinates[1].toFixed(4)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez votre propriété en détail..."
                rows={4}
                required
              />
            </div>

            {/* Images */}
            <div>
              <Label>Images</Label>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="URL de l'image"
                  />
                  <Button type="button" onClick={addImage} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage(imageUrl)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Équipements */}
            <div>
              <Label>Équipements et caractéristiques</Label>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Ajouter un équipement"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={() => addFeature()} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {commonFeatures.map(feature => (
                    <Button
                      key={feature}
                      type="button"
                      variant={formData.features.includes(feature) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (formData.features.includes(feature)) {
                          removeFeature(feature);
                        } else {
                          addFeature(feature);
                        }
                      }}
                    >
                      {feature}
                    </Button>
                  ))}
                </div>
                
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {formData.features.map(feature => (
                      <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeFeature(feature)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Informations du vendeur */}
            <div>
              <Label className="text-lg">Informations de contact</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="seller-name">Nom *</Label>
                  <Input
                    id="seller-name"
                    type="text"
                    value={formData.seller.name}
                    onChange={(e) => handleInputChange('seller.name', e.target.value)}
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seller-phone">Téléphone *</Label>
                  <Input
                    id="seller-phone"
                    type="tel"
                    value={formData.seller.phone}
                    onChange={(e) => handleInputChange('seller.phone', e.target.value)}
                    placeholder="+241 06 12 34 56"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seller-email">Email *</Label>
                  <Input
                    id="seller-email"
                    type="email"
                    value={formData.seller.email}
                    onChange={(e) => handleInputChange('seller.email', e.target.value)}
                    placeholder="votre@email.ga"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'En cours...' : (property ? 'Mettre à jour' : 'Publier')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de sélection de localisation */}
      {showMap && (
        <MapLocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowMap(false)}
          initialCoordinates={formData.location.coordinates}
        />
      )}
    </div>
  );
};

export default PropertyForm;