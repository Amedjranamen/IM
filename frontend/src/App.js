import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Separator } from './components/ui/separator';
import { Textarea } from './components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { toast, Toaster } from 'sonner';
import { Heart, MapPin, Home as HomeIcon, Phone, Mail, User, Plus, MessageCircle, Search, LogOut, LogIn, Map as MapIcon, Filter, SlidersHorizontal, X, Upload, Star, Settings, Edit, Trash2, Eye } from 'lucide-react';
import Map from './components/Map';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Connexion réussie !');
      return true;
    } catch (error) {
      toast.error('Erreur de connexion');
      return false;
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password, phone });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Inscription réussie !');
      return true;
    } catch (error) {
      toast.error('Erreur d\'inscription');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Déconnexion réussie');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Header Component
const Header = ({ searchQuery, setSearchQuery, onSearch, activeView, setActiveView }) => {
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IMMO&CO</h1>
              <p className="text-sm text-gray-500">Immobilier Gabon</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="pk12"
                  className="h-12 pr-4 text-base border-2 border-gray-200 rounded-l-md focus:border-orange-500 focus:ring-0"
                />
              </div>
              <Button 
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 h-12 px-8 rounded-l-none border-2 border-orange-500 text-base font-medium"
              >
                <Search className="w-5 h-5" />
              </Button>
            </form>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView('search')}
              className={`text-gray-600 hover:text-orange-500 ${activeView === 'search' ? 'text-orange-500 font-medium' : ''}`}
            >
              Recherche avancée
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView('map')}
              className={`text-gray-600 hover:text-orange-500 ${activeView === 'map' ? 'text-orange-500 font-medium' : ''}`}
            >
              Carte
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('favorites')}
                className={`text-gray-600 hover:text-orange-500 ${activeView === 'favorites' ? 'text-orange-500 font-medium' : ''}`}
              >
                Favoris
              </Button>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-6">
                      <Plus className="w-4 h-4 mr-2" />
                      Publier
                    </Button>
                  </DialogTrigger>
                  <PublishDialog onClose={() => setPublishOpen(false)} />
                </Dialog>

                <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {user.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                    <button 
                      onClick={logout}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Connexion
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10">
                      <LogIn className="w-4 h-4 mr-2" />
                      Connexion
                    </Button>
                  </DialogTrigger>
                  <LoginDialog onClose={() => setLoginOpen(false)} />
                </Dialog>

                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-10">
                      S'inscrire
                    </Button>
                  </DialogTrigger>
                  <RegisterDialog onClose={() => setRegisterOpen(false)} />
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section 
      className="relative bg-orange-600 text-white py-16"
      style={{
        backgroundImage: `linear-gradient(rgba(251, 146, 60, 0.8), rgba(251, 146, 60, 0.9)), url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          IMMO&CO
        </h1>
        <p className="text-xl md:text-2xl mb-2 font-light">
          Votre plateforme immobilière au Gabon
        </p>
        <p className="text-lg opacity-90">
          Trouvez la propriété de vos rêves ou vendez votre bien en toute simplicité
        </p>
      </div>
    </section>
  );
};

// Filters Sidebar
const FiltersSidebar = ({ filters, setFilters, onApplyFilters, cities, neighborhoods }) => {
  const resetFilters = () => {
    setFilters({
      city: '',
      neighborhood: '',
      listing_type: '',
      price_min: '',
      price_max: '',
      surface_min: '',
      surface_max: '',
      rooms_min: '',
      rooms_max: ''
    });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        <Button variant="outline" size="sm" onClick={resetFilters}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Type de transaction</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input 
                type="radio" 
                name="listing_type" 
                value=""
                checked={filters.listing_type === ''}
                onChange={(e) => setFilters({...filters, listing_type: e.target.value})}
                className="text-orange-500"
              />
              <span className="text-sm">Tous les types</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="radio" 
                name="listing_type" 
                value="sale"
                checked={filters.listing_type === 'sale'}
                onChange={(e) => setFilters({...filters, listing_type: e.target.value})}
                className="text-orange-500"
              />
              <span className="text-sm">Vente</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="radio" 
                name="listing_type" 
                value="rent"
                checked={filters.listing_type === 'rent'}
                onChange={(e) => setFilters({...filters, listing_type: e.target.value})}
                className="text-orange-500"
              />
              <span className="text-sm">Location</span>
            </label>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Ville</Label>
          <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les villes</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Quartier</Label>
          <Select value={filters.neighborhood} onValueChange={(value) => setFilters({...filters, neighborhood: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un quartier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les quartiers</SelectItem>
              {neighborhoods.map(neighborhood => (
                <SelectItem key={neighborhood} value={neighborhood}>{neighborhood}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Prix (XAF)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.price_min}
              onChange={(e) => setFilters({...filters, price_min: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.price_max}
              onChange={(e) => setFilters({...filters, price_max: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Surface (m²)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.surface_min}
              onChange={(e) => setFilters({...filters, surface_min: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.surface_max}
              onChange={(e) => setFilters({...filters, surface_max: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Nombre de pièces</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.rooms_min}
              onChange={(e) => setFilters({...filters, rooms_min: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.rooms_max}
              onChange={(e) => setFilters({...filters, rooms_max: e.target.value})}
            />
          </div>
        </div>

        <Button 
          onClick={onApplyFilters} 
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          Appliquer les filtres
        </Button>
      </div>
    </div>
  );
};

// Login Dialog
const LoginDialog = ({ onClose }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Connexion</DialogTitle>
        <DialogDescription>
          Connectez-vous à votre compte IMMO&CO
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

// Register Dialog
const RegisterDialog = ({ onClose }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await register(name, email, password, phone);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Inscription</DialogTitle>
        <DialogDescription>
          Créez votre compte IMMO&CO
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

// Publish Dialog with Image Upload
const PublishDialog = ({ onClose, editListing = null }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(editListing?.title || '');
  const [description, setDescription] = useState(editListing?.description || '');
  const [listingType, setListingType] = useState(editListing?.listing_type || 'sale');
  const [price, setPrice] = useState(editListing?.price?.toString() || '');
  const [city, setCity] = useState(editListing?.city || '');
  const [neighborhood, setNeighborhood] = useState(editListing?.neighborhood || '');
  const [address, setAddress] = useState(editListing?.address || '');
  const [surface, setSurface] = useState(editListing?.surface?.toString() || '');
  const [rooms, setRooms] = useState(editListing?.rooms?.toString() || '');
  const [placedMarker, setPlacedMarker] = useState(
    editListing?.lat && editListing?.lon ? { lat: editListing.lat, lng: editListing.lon } : null
  );
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 10) {
      toast.error('Maximum 10 fichiers autorisés');
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleMapClick = async (latlng) => {
    setPlacedMarker(latlng);
    setIsPlacingMarker(false);
    
    try {
      const response = await axios.get(`${API}/reverse-geocode?lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = response.data;
      setCity(data.city || '');
      setNeighborhood(data.neighborhood || '');
      setAddress(data.address || '');
      toast.success('Localisation définie !');
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      toast.error('Impossible de récupérer les informations de localisation');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const listingData = {
        title,
        description,
        listing_type: listingType,
        price: parseFloat(price),
        city,
        neighborhood,
        address,
        lat: placedMarker?.lat || null,
        lon: placedMarker?.lng || null,
        surface: surface ? parseInt(surface) : null,
        rooms: rooms ? parseInt(rooms) : null
      };

      let listingResponse;
      if (editListing) {
        listingResponse = await axios.put(`${API}/listings/${editListing.id}`, listingData);
      } else {
        listingResponse = await axios.post(`${API}/listings`, listingData);
      }

      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        await axios.post(`${API}/listings/${listingResponse.data.id}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success(editListing ? 'Annonce modifiée avec succès !' : 'Annonce publiée avec succès !');
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }

    setLoading(false);
  };

  return (
    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editListing ? 'Modifier l\'annonce' : 'Déposer une annonce'}</DialogTitle>
        <DialogDescription>
          {step === 1 ? 'Remplissez les informations de votre bien' : 'Localisez votre bien sur la carte'}
        </DialogDescription>
      </DialogHeader>

      {step === 1 ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Belle villa avec piscine à Libreville"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre bien en détail..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type d'annonce *</Label>
              <Select value={listingType} onValueChange={setListingType}>
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
              <Label htmlFor="price">Prix (XAF) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 50000000"
                required
              />
            </div>

            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Libreville"
                required
              />
            </div>

            <div>
              <Label htmlFor="neighborhood">Quartier</Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Batterie IV"
              />
            </div>

            <div>
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input
                id="surface"
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="Ex: 150"
              />
            </div>

            <div>
              <Label htmlFor="rooms">Nombre de pièces</Label>
              <Input
                id="rooms"
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                placeholder="Ex: 4"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Adresse complète</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse détaillée"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Images et vidéos (max 10 fichiers)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="bg-gray-100 p-2 rounded text-xs truncate">
                          {file.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="flex items-center"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Localiser sur la carte
            </Button>
            
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Publication...' : (editListing ? 'Modifier' : 'Publier l\'annonce')}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="h-96">
            <Map
              onMapClick={handleMapClick}
              isPlacingMarker={isPlacingMarker}
              placedMarker={placedMarker}
              height="100%"
            />
          </div>
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
            >
              Retour au formulaire
            </Button>
            
            <div className="space-x-2">
              <Button
                type="button"
                onClick={() => setIsPlacingMarker(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MapIcon className="w-4 h-4 mr-2" />
                Placer un marqueur
              </Button>
              
              {placedMarker && (
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirmer la localisation
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  );
};

// Listing Card
const ListingCard = ({ listing, onMarkerClick, showActions = false, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [likesCount, setLikesCount] = useState(listing.likes_count || 0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (user) {
      checkIfLiked();
      checkIfFavorite();
    }
  }, [listing.id, user]);

  const checkIfLiked = async () => {
    try {
      const response = await axios.get(`${API}/listings/${listing.id}/liked`);
      setLiked(response.data.liked);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const response = await axios.get(`${API}/favorites/${listing.id}/check`);
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast.error('Connectez-vous pour liker');
      return;
    }

    try {
      const response = await axios.post(`${API}/listings/${listing.id}/like`);
      setLiked(response.data.liked);
      setLikesCount(response.data.likes_count);
    } catch (error) {
      toast.error('Erreur lors du like');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${listing.id}`);
        setIsFavorite(false);
        toast.success('Retiré des favoris');
      } else {
        await axios.post(`${API}/favorites/${listing.id}`);
        setIsFavorite(true);
        toast.success('Ajouté aux favoris');
      }
    } catch (error) {
      toast.error('Erreur lors de la gestion des favoris');
    }
  };

  const loadComments = async () => {
    try {
      const response = await axios.get(`${API}/listings/${listing.id}/comments`);
      setComments(response.data);
      setShowComments(true);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Connectez-vous pour commenter');
      return;
    }

    try {
      const response = await axios.post(`${API}/listings/${listing.id}/comments`, {
        text: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' XAF';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getImageUrl = (filename) => {
    return `${BACKEND_URL}/uploads/${filename}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200">
      {/* Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center relative">
        {listing.images && listing.images.length > 0 ? (
          <img 
            src={getImageUrl(listing.images[0])} 
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <HomeIcon className="w-16 h-16 text-orange-400" />
        )}
        
        <div className="absolute top-2 right-2 flex space-x-1">
          <Badge 
            variant={listing.listing_type === 'sale' ? 'default' : 'secondary'}
            className={listing.listing_type === 'sale' ? 'bg-blue-600' : 'bg-green-600'}
          >
            {listing.listing_type === 'sale' ? 'Vente' : 'Location'}
          </Badge>
          
          {user && (
            <Button
              size="sm"
              variant="secondary" 
              className="h-6 w-6 p-0"
              onClick={toggleFavorite}
            >
              <Star className={`w-3 h-3 ${isFavorite ? 'fill-current text-yellow-500' : ''}`} />
            </Button>
          )}
        </div>

        {listing.lat && listing.lon && (
          <Button
            size="sm"
            variant="secondary" 
            className="absolute bottom-2 right-2 h-8 px-2"
            onClick={() => onMarkerClick && onMarkerClick(listing)}
          >
            <MapIcon className="w-3 h-3 mr-1" />
            Carte
          </Button>
        )}

        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            +{listing.images.length - 1} photos
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 text-gray-900">
              {listing.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {listing.description}
            </p>
          </div>

          <div className="text-2xl font-bold text-orange-600">
            {formatPrice(listing.price)}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1 text-orange-500" />
            <span className="font-medium">
              {listing.city}{listing.neighborhood && `, ${listing.neighborhood}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex space-x-4">
              {listing.surface && (
                <span className="flex items-center">
                  {listing.surface} m²
                </span>
              )}
              {listing.rooms && (
                <span className="flex items-center">
                  {listing.rooms} pièces
                </span>
              )}
            </div>
            <span>{formatDate(listing.created_at)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLike}
                className={`flex items-center space-x-1 ${
                  liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={loadComments}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{listing.comments_count || 0}</span>
              </Button>
            </div>

            {showActions && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(listing)}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(listing.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-1" />
              <span className="font-medium">{listing.owner_name}</span>
            </div>
          </div>

          {showComments && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              {user && (
                <form onSubmit={addComment} className="flex space-x-2">
                  <Input
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={!newComment.trim()}>
                    Envoyer
                  </Button>
                </form>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{comment.author_name}</span>
                      <span className="text-gray-400 text-xs">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Home Component
const Home = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('home');
  const [selectedListing, setSelectedListing] = useState(null);
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [editingListing, setEditingListing] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    neighborhood: '',
    listing_type: '',
    price_min: '',
    price_max: '',
    surface_min: '',
    surface_max: '',
    rooms_min: '',
    rooms_max: ''
  });

  useEffect(() => {
    fetchListings();
    fetchCities();
    fetchNeighborhoods();
    if (user) {
      fetchFavorites();
      fetchMyListings();
    }
  }, [user]);

  const fetchListings = async (searchParams = {}) => {
    setLoading(true);
    try {
      const params = {
        random_order: true,
        limit: 20,
        ...searchParams
      };
      
      const response = await axios.get(`${API}/listings`, { params });
      setListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API}/cities`);
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      const response = await axios.get(`${API}/neighborhoods`);
      setNeighborhoods(response.data);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchMyListings = async () => {
    try {
      const response = await axios.get(`${API}/my-listings`);
      setMyListings(response.data);
    } catch (error) {
      console.error('Error fetching my listings:', error);
    }
  };

  const handleSearch = () => {
    const searchParams = {
      search: searchQuery || undefined,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
    };
    fetchListings(searchParams);
  };

  const handleApplyFilters = () => {
    handleSearch();
  };

  const handleMarkerClick = (listing) => {
    setSelectedListing(listing);
    setActiveView('map');
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      try {
        await axios.delete(`${API}/listings/${listingId}`);
        toast.success('Annonce supprimée');
        fetchMyListings();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    switch (activeView) {
      case 'search':
        return (
          <div className="flex">
            <FiltersSidebar
              filters={filters}
              setFilters={setFilters}
              onApplyFilters={handleApplyFilters}
              cities={cities}
              neighborhoods={neighborhoods}
            />
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Biens immobiliers ({listings.length} résultat{listings.length > 1 ? 's' : ''})
                </h2>
                <Button
                  onClick={() => fetchListings()}
                  variant="outline"
                  size="sm"
                >
                  Actualiser
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing} 
                    onMarkerClick={handleMarkerClick}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="h-screen">
            <Map
              listings={listings}
              onMarkerClick={setSelectedListing}
              height="100%"
            />
          </div>
        );

      case 'favorites':
        return (
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes favoris</h2>
            {favorites.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Aucun favori pour le moment
                </h3>
                <p className="text-gray-500">
                  Ajoutez des annonces à vos favoris pour les retrouver ici
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing} 
                    onMarkerClick={handleMarkerClick}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes annonces</h2>
            {myListings.length === 0 ? (
              <div className="text-center py-16">
                <HomeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Aucune annonce publiée
                </h3>
                <p className="text-gray-500 mb-4">
                  Commencez par publier votre première annonce
                </p>
                <Button 
                  onClick={() => setActiveView('home')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Publier une annonce
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myListings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing} 
                    onMarkerClick={handleMarkerClick}
                    showActions={true}
                    onEdit={setEditingListing}
                    onDelete={handleDeleteListing}
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Biens immobiliers ({listings.length} résultat{listings.length > 1 ? 's' : ''})
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveView('map')}
                  className="flex items-center"
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  Voir sur la carte
                </Button>
                <Button
                  onClick={() => fetchListings()}
                  variant="outline"
                  size="sm"
                >
                  Actualiser
                </Button>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-16">
                <HomeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Aucune annonce trouvée
                </h3>
                <p className="text-gray-500 mb-4">
                  Essayez de modifier vos critères de recherche
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      city: '',
                      neighborhood: '',
                      listing_type: '',
                      price_min: '',
                      price_max: '',
                      surface_min: '',
                      surface_max: '',
                      rooms_min: '',
                      rooms_max: ''
                    });
                    fetchListings();
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Voir toutes les annonces
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing} 
                    onMarkerClick={handleMarkerClick}
                  />
                ))}
              </div>
            )}

            {listings.length > 0 && (
              <div className="text-center mt-8">
                <Button 
                  onClick={() => fetchListings()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Voir plus d'annonces
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      {activeView === 'home' && <HeroSection />}

      <main>
        {renderContent()}
      </main>

      {editingListing && (
        <PublishDialog
          editListing={editingListing}
          onClose={() => {
            setEditingListing(null);
            fetchMyListings();
          }}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;