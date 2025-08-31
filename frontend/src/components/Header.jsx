import React, { useState } from 'react';
import { Search, Menu, Heart, User, Plus, MapPin, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Header = ({ onSearch, onShowMap, onPublish, onAdvancedSearch, showMap }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-orange-600">IMMO&CO</h1>
            <p className="text-xs text-gray-500">Immobilier Gabon</p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Rechercher un bien immobilier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-2"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1 bg-orange-600 hover:bg-orange-700"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onShowMap}
              className="text-gray-700 hover:text-orange-600"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {showMap ? 'Liste' : 'Carte'}
            </Button>
            
            <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
              <Heart className="h-4 w-4 mr-2" />
              Favoris
            </Button>
            
            <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
              <User className="h-4 w-4 mr-2" />
              Mon compte
            </Button>
            
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={onPublish}
            >
              <Plus className="h-4 w-4 mr-2" />
              Publier
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                onClick={onShowMap}
                className="text-left justify-start"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {showMap ? 'Vue Liste' : 'Vue Carte'}
              </Button>
              <Button variant="ghost" className="text-left justify-start">
                <Heart className="h-4 w-4 mr-2" />
                Mes Favoris
              </Button>
              <Button variant="ghost" className="text-left justify-start">
                <User className="h-4 w-4 mr-2" />
                Mon Compte
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white justify-start"
                onClick={onPublish}
              >
                <Plus className="h-4 w-4 mr-2" />
                Publier une annonce
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;