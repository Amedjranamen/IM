import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { propertiesService, locationsService } from '../services/api';
import { useToast } from '../hooks/use-toast';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Charger les villes au démarrage
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = useCallback(async () => {
    try {
      const citiesData = await locationsService.getCities();
      setCities(citiesData);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
      setError('Impossible de charger les villes');
    }
  }, []);

  const loadProperties = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const propertiesData = await propertiesService.getProperties(filters);
      setProperties(propertiesData);
      return propertiesData;
    } catch (error) {
      console.error('Erreur lors du chargement des propriétés:', error);
      setError('Impossible de charger les propriétés');
      toast({
        title: "Erreur",
        description: "Impossible de charger les propriétés",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createProperty = useCallback(async (propertyData) => {
    setLoading(true);
    try {
      const newProperty = await propertiesService.createProperty(propertyData);
      setProperties(prev => [newProperty, ...prev]);
      
      toast({
        title: "Succès",
        description: "Propriété créée avec succès",
      });
      
      return newProperty;
    } catch (error) {
      console.error('Erreur lors de la création de la propriété:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la propriété",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProperty = useCallback(async (id, propertyData) => {
    setLoading(true);
    try {
      const updatedProperty = await propertiesService.updateProperty(id, propertyData);
      setProperties(prev => 
        prev.map(property => 
          property.id === id ? updatedProperty : property
        )
      );
      
      toast({
        title: "Succès",
        description: "Propriété mise à jour avec succès",
      });
      
      return updatedProperty;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la propriété:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la propriété",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteProperty = useCallback(async (id) => {
    try {
      await propertiesService.deleteProperty(id);
      setProperties(prev => prev.filter(property => property.id !== id));
      
      toast({
        title: "Succès",
        description: "Propriété supprimée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la propriété:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la propriété",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const likeProperty = useCallback(async (id, isLiked) => {
    try {
      const result = await propertiesService.likeProperty(id, isLiked);
      
      setProperties(prev => 
        prev.map(property => 
          property.id === id 
            ? { ...property, likes: result.likes }
            : property
        )
      );

      toast({
        description: isLiked ? "Ajouté aux favoris" : "Retiré des favoris",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erreur lors du like de la propriété:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les favoris",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getNeighborhoods = useCallback(async (city) => {
    try {
      const result = await locationsService.getNeighborhoods(city);
      return result.neighborhoods || [];
    } catch (error) {
      console.error('Erreur lors du chargement des quartiers:', error);
      return [];
    }
  }, []);

  const value = {
    // State
    properties,
    cities,
    loading,
    error,
    
    // Actions
    loadProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    likeProperty,
    getNeighborhoods,
    loadCities,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};