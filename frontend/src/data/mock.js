// Mock data for IMMO&CO - Gabon Real Estate Platform

export const mockProperties = [
  {
    id: "1",
    title: "Villa moderne 4 chambres - Libreville Centre",
    price: 85000000,
    type: "sale",
    category: "Villa",
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    location: {
      city: "Libreville",
      neighborhood: "Centre-ville",
      coordinates: [9.4536, 0.3955]
    },
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
    ],
    description: "Magnifique villa moderne située en plein centre de Libreville. Propriété récente avec finitions haut de gamme, jardin paysagé et parking pour 2 véhicules.",
    features: ["Climatisation", "Jardin", "Parking", "Sécurité"],
    createdAt: "2024-12-15T10:30:00Z",
    views: 245,
    likes: 12,
    comments: [
      {
        id: "c1",
        author: "Marie Nguema",
        content: "Belle propriété ! Le prix est-il négociable ?",
        createdAt: "2024-12-16T09:15:00Z"
      }
    ],
    seller: {
      name: "Jean-Paul Obame",
      phone: "+241 06 12 34 56",
      email: "jp.obame@email.ga"
    }
  },
  {
    id: "2", 
    title: "Appartement 2 pièces - Quartier Glass",
    price: 450000,
    type: "rent",
    category: "Appartement",
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    location: {
      city: "Libreville",
      neighborhood: "Glass",
      coordinates: [9.4489, 0.4021]
    },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
    ],
    description: "Appartement moderne au 3ème étage avec vue dégagée. Proche des commerces et transports. Idéal pour jeune couple ou professionnel.",
    features: ["Climatisation", "Balcon", "Ascenseur", "Parking"],
    createdAt: "2024-12-14T16:45:00Z",
    views: 156,
    likes: 8,
    comments: [],
    seller: {
      name: "Sophie Ikapi",
      phone: "+241 07 89 45 23",
      email: "s.ikapi@email.ga"
    }
  },
  {
    id: "3",
    title: "Terrain constructible 800m² - PK12",
    price: 25000000,
    type: "sale",
    category: "Terrain",
    bedrooms: 0,
    bathrooms: 0,
    area: 800,
    location: {
      city: "Libreville",
      neighborhood: "PK12",
      coordinates: [9.3826, 0.4844]
    },
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
    ],
    description: "Terrain plat et viabilisé de 800m² dans une zone résidentielle calme. Idéal pour construction de villa familiale. Titre foncier en règle.",
    features: ["Viabilisé", "Titre foncier", "Zone résidentielle", "Accès bitumé"],
    createdAt: "2024-12-13T11:20:00Z",
    views: 89,
    likes: 5,
    comments: [
      {
        id: "c2",
        author: "Paul Mintsa",
        content: "Le terrain est-il en pente ?",
        createdAt: "2024-12-14T14:30:00Z"
      }
    ],
    seller: {
      name: "Patrick Mba",
      phone: "+241 06 78 90 12",
      email: "p.mba@email.ga"
    }
  },
  {
    id: "4",
    title: "Maison 3 chambres - Port-Gentil Centre",
    price: 65000000,
    type: "sale", 
    category: "Maison",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    location: {
      city: "Port-Gentil",
      neighborhood: "Centre",
      coordinates: [-0.7193, 8.7815]
    },
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
    ],
    description: "Maison familiale bien entretenue avec jardin. Située dans un quartier résidentiel calme de Port-Gentil. Proche écoles et commerces.",
    features: ["Jardin", "Garage", "Véranda", "Portail électrique"],
    createdAt: "2024-12-12T08:15:00Z",
    views: 198,
    likes: 15,
    comments: [],
    seller: {
      name: "Christine Oyane",
      phone: "+241 05 67 89 01",
      email: "c.oyane@email.ga"
    }
  },
  {
    id: "5",
    title: "Studio meublé - Libreville Akanda",
    price: 250000,
    type: "rent",
    category: "Studio",
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    location: {
      city: "Libreville",
      neighborhood: "Akanda",
      coordinates: [9.5534, 0.5139]
    },
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
    ],
    description: "Studio moderne entièrement meublé et équipé. Parfait pour étudiant ou jeune professionnel. Charges incluses.",
    features: ["Meublé", "Climatisation", "WiFi", "Charges incluses"],
    createdAt: "2024-12-11T19:30:00Z",
    views: 134,
    likes: 7,
    comments: [
      {
        id: "c3",
        author: "Sandrine Ella",
        content: "Disponible dès janvier ?",
        createdAt: "2024-12-12T16:45:00Z"
      }
    ],
    seller: {
      name: "Marcel Eyeghe",
      phone: "+241 06 23 45 67",
      email: "m.eyeghe@email.ga"
    }
  }
];

export const mockCities = [
  { name: "Libreville", neighborhoods: ["Centre-ville", "Glass", "Akanda", "PK12", "Oloumi", "Nzeng-Ayong"] },
  { name: "Port-Gentil", neighborhoods: ["Centre", "Bord de mer", "Quartier résidentiel", "Zone industrielle"] },
  { name: "Franceville", neighborhoods: ["Centre", "Quartier universitaire", "Residential"] },
  { name: "Oyem", neighborhoods: ["Centre", "Nouveau quartier", "Traditional"] },
  { name: "Moanda", neighborhoods: ["Centre", "Mining area", "Residential"] }
];

export const mockCategories = [
  "Villa",
  "Maison", 
  "Appartement",
  "Studio",
  "Terrain",
  "Bureau",
  "Commerce"
];

export const mockFeatures = [
  "Climatisation",
  "Jardin",
  "Parking",
  "Piscine",
  "Sécurité",
  "Balcon",
  "Terrasse",
  "Garage",
  "Ascenseur",
  "Meublé",
  "WiFi",
  "Générateur"
];