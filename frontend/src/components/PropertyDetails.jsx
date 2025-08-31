import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, MapPin, User, Phone, Mail, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { commentsService } from '../services/api';
import { useApp } from '../contexts/AppContext';

const PropertyDetails = ({ property, onClose, onEdit, onDelete }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  const { likeProperty } = useApp();

  useEffect(() => {
    if (property) {
      loadComments();
    }
  }, [property]);

  const loadComments = async () => {
    try {
      const propertyComments = await commentsService.getCommentsByProperty(property.id);
      setComments(propertyComments);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthor.trim()) return;

    setLoading(true);
    try {
      const commentData = {
        property_id: property.id,
        author: commentAuthor.trim(),
        content: newComment.trim()
      };

      const newCommentResult = await commentsService.createComment(commentData);
      setComments(prev => [newCommentResult, ...prev]);
      setNewComment('');
      // Ne pas effacer le nom de l'auteur pour faciliter l'ajout de plusieurs commentaires
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    await likeProperty(property.id, newLikedState);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' XAF';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(property)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={() => onDelete(property.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images et informations principales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Carrousel d'images */}
              {property.images && property.images.length > 0 && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={property.images[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-80 object-cover rounded-lg"
                    />
                    {property.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {property.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {property.images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto">
                      {property.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${property.title} ${index + 1}`}
                          className={`w-20 h-20 object-cover rounded cursor-pointer flex-shrink-0 ${
                            index === currentImageIndex ? 'ring-2 ring-orange-500' : ''
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Prix et actions */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatPrice(property.price)}
                  </p>
                  <p className="text-gray-600">
                    {property.type === 'sale' ? 'À vendre' : 'À louer'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-500">
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-sm">{property.views} vues</span>
                  </div>
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className="flex items-center"
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {property.likes}
                  </Button>
                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                  <p className="text-sm text-gray-600">Chambres</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                  <p className="text-sm text-gray-600">Salle de bain</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{property.area}</p>
                  <p className="text-sm text-gray-600">m²</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{property.category}</p>
                  <p className="text-sm text-gray-600">Type</p>
                </div>
              </div>

              {/* Localisation */}
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{property.location.neighborhood}, {property.location.city}</span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>

              {/* Équipements */}
              {property.features && property.features.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, index) => (
                      <Badge key={index} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Date de publication */}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Publié le {formatDate(property.created_at)}</span>
              </div>
            </div>

            {/* Sidebar - Contact et commentaires */}
            <div className="space-y-6">
              {/* Informations de contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">{property.seller.name}</p>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`tel:${property.seller.phone}`} className="text-blue-600 hover:underline">
                      {property.seller.phone}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`mailto:${property.seller.email}`} className="text-blue-600 hover:underline">
                      {property.seller.email}
                    </a>
                  </div>
                  <Button className="w-full">
                    Contacter le vendeur
                  </Button>
                </CardContent>
              </Card>

              {/* Section commentaires */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Commentaires ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Formulaire d'ajout de commentaire */}
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Votre nom"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      required
                    />
                    <Textarea
                      placeholder="Votre commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                      rows={3}
                    />
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Ajout...' : 'Ajouter un commentaire'}
                    </Button>
                  </form>

                  <Separator />

                  {/* Liste des commentaires */}
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {comment.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-sm">{comment.author}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(comment.created_at)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Aucun commentaire pour le moment.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;