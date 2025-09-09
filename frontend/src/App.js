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
import { Heart, MapPin, Home as HomeIcon, Phone, Mail, User, Plus, MessageCircle, Search, LogOut, LogIn, Map as MapIcon, Filter, SlidersHorizontal, X } from 'lucide-react';
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

// Components
const Header = ({ searchQuery, setSearchQuery, onSearch, showFilters, setShowFilters }) => {
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-orange-500 text-white text-xs py-1">
        <div className="container mx-auto px-4 text-center">
          🏠 IMMO&CO - La plateforme immobilière du Gabon
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-orange-500 p-2 rounded-lg">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">IMMO&CO</h1>
              <p className="text-xs text-gray-500">Immobilier Gabon</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une ville, quartier, type de bien..."
                  className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-l-md focus:border-orange-500 focus:ring-0"
                />
              </div>
              <Button 
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 px-6 rounded-l-none border-2 border-orange-500"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-300"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtres
            </Button>

            {user ? (
              <>
                <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Déposer une annonce
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
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <LogIn className="w-4 h-4 mr-2" />
                      Se connecter
                    </Button>
                  </DialogTrigger>
                  <LoginDialog onClose={() => setLoginOpen(false)} />
                </Dialog>

                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      S'inscrire
                    </Button>
                  </DialogTrigger>
                  <RegisterDialog onClose={() => setRegisterOpen(false)} />
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {/* Secondary navigation */}
        <div className="flex items-center space-x-6 mt-3 pt-3 border-t border-gray-100">
          <button className="text-sm text-gray-600 hover:text-orange-500 font-medium">
            🏠 Vente
          </button>
          <button className="text-sm text-gray-600 hover:text-orange-500 font-medium">
            🔑 Location
          </button>
          <button className="text-sm text-gray-600 hover:text-orange-500 font-medium">
            🗺️ Carte
          </button>
          <button className="text-sm text-gray-600 hover:text-orange-500 font-medium">
            💰 Estimer mon bien
          </button>
        </div>
      </div>
    </header>
  );
};

// Filters Component
const FiltersPanel = ({ filters, setFilters, onApplyFilters, cities, neighborhoods }) => {
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
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div>
            <Label className="text-xs text-gray-600">Ville</Label>
            <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes" />
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
            <Label className="text-xs text-gray-600">Quartier</Label>
            <Select value={filters.neighborhood} onValueChange={(value) => setFilters({...filters, neighborhood: value})}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous" />
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
            <Label className="text-xs text-gray-600">Type</Label>
            <Select value={filters.listing_type} onValueChange={(value) => setFilters({...filters, listing_type: value})}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="sale">Vente</SelectItem>
                <SelectItem value="rent">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-600">Prix min</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.price_min}
              onChange={(e) => setFilters({...filters, price_min: e.target.value})}
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-600">Prix max</Label>
            <Input
              type="number"
              placeholder="∞"
              value={filters.price_max}
              onChange={(e) => setFilters({...filters, price_max: e.target.value})}
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-600">Surface min</Label>
            <Input
              type="number"
              placeholder="0 m²"
              value={filters.surface_min}
              onChange={(e) => setFilters({...filters, surface_min: e.target.value})}
              className="h-9"
            />
          </div>

          <div className="flex items-end space-x-2">
            <Button onClick={onApplyFilters} className="bg-orange-500 hover:bg-orange-600 h-9">
              Rechercher
            </Button>
            <Button variant="outline" onClick={resetFilters} className="h-9">
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const PublishDialog = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('sale');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [surface, setSurface] = useState('');
  const [rooms, setRooms] = useState('');
  const [placedMarker, setPlacedMarker] = useState(null);
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMapClick = async (latlng) => {
    setPlacedMarker(latlng);
    setIsPlacingMarker(false);
    
    // Reverse geocode to get address info
    try {
      const response = await axios.get(`${API}/reverse-geocode?lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = response.data;
      setCity(data.city || '');
      setNeighborhood(data.neighborhood || '');
      setAddress(data.address || '');
      toast.success('Localisation définie ! Informations automatiquement remplies.');
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      toast.error('Impossible de récupérer les informations de localisation');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/listings`, {
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
      });

      toast.success('Annonce publiée avec succès !');
      onClose();
      window.location.reload(); // Refresh to show new listing
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }

    setLoading(false);
  };

  return (
    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Déposer une annonce</DialogTitle>
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
                placeholder="Adresse détaillée (remplie automatiquement avec la carte)"
              />
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
                {loading ? 'Publication...' : 'Publier l\'annonce'}
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
              ← Retour au formulaire
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

const ListingCard = ({ listing, onMarkerClick }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(listing.likes_count || 0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (user) {
      checkIfLiked();
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200">
      {/* Image placeholder - leboncoin style */}
      <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center relative">
        <HomeIcon className="w-16 h-16 text-orange-400" />
        <div className="absolute top-2 right-2">
          <Badge 
            variant={listing.listing_type === 'sale' ? 'default' : 'secondary'}
            className={listing.listing_type === 'sale' ? 'bg-blue-600' : 'bg-green-600'}
          >
            {listing.listing_type === 'sale' ? 'Vente' : 'Location'}
          </Badge>
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
                  📐 {listing.surface} m²
                </span>
              )}
              {listing.rooms && (
                <span className="flex items-center">
                  🚪 {listing.rooms} pièces
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

const Home = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
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
  }, []);

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
    setShowMap(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
        <div className="container mx-auto px-4 py-8">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      
      {showFilters && (
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          onApplyFilters={handleApplyFilters}
          cities={cities}
          neighborhoods={neighborhoods}
        />
      )}

      <main className="container mx-auto px-4 py-6">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {listings.length} annonce{listings.length > 1 ? 's' : ''} trouvée{listings.length > 1 ? 's' : ''}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="flex items-center"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              {showMap ? 'Masquer la carte' : 'Voir sur la carte'}
            </Button>
          </div>
          
          <Button
            onClick={() => fetchListings()}
            variant="outline"
            size="sm"
          >
            🔄 Actualiser
          </Button>
        </div>

        {showMap && (
          <div className="mb-6">
            <Map
              listings={listings}
              onMarkerClick={setSelectedListing}
              height="400px"
              className="rounded-lg border border-gray-200"
            />
          </div>
        )}

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
      </main>
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