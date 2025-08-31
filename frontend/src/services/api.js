import axios from 'axios';

// Configuration de base pour l'API
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

// Service pour les propriétés
export const propertiesService = {
  // Récupérer toutes les propriétés avec filtres
  getProperties: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value);
        }
      }
    });

    const response = await api.get(`/properties?${params.toString()}`);
    return response.data;
  },

  // Récupérer une propriété par ID
  getProperty: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  // Créer une nouvelle propriété
  createProperty: async (propertyData) => {
    const response = await api.post('/properties', propertyData);
    return response.data;
  },

  // Mettre à jour une propriété
  updateProperty: async (id, propertyData) => {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data;
  },

  // Supprimer une propriété
  deleteProperty: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  // Liker/disliker une propriété
  likeProperty: async (id, isLiked) => {
    const response = await api.post(`/properties/${id}/like`, { is_liked: isLiked });
    return response.data;
  },

  // Récupérer les commentaires d'une propriété
  getPropertyComments: async (id) => {
    const response = await api.get(`/properties/${id}/comments`);
    return response.data;
  }
};

// Service pour les commentaires
export const commentsService = {
  // Créer un nouveau commentaire
  createComment: async (commentData) => {
    const response = await api.post('/comments', commentData);
    return response.data;
  },

  // Récupérer les commentaires d'une propriété
  getCommentsByProperty: async (propertyId) => {
    const response = await api.get(`/comments/property/${propertyId}`);
    return response.data;
  }
};

// Service pour les locations
export const locationsService = {
  // Récupérer toutes les villes
  getCities: async () => {
    const response = await api.get('/locations/cities');
    return response.data;
  },

  // Récupérer les quartiers d'une ville
  getNeighborhoods: async (city) => {
    const response = await api.get(`/locations/neighborhoods/${city}`);
    return response.data;
  }
};

export default api;