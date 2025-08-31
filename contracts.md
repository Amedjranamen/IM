# IMMO&CO - Full Stack Development Contracts

## API Contracts

### Properties API

#### GET /api/properties
- **Purpose**: Get all properties with filtering options
- **Query Parameters**:
  - `search` (string): Search in title, description, location
  - `type` (string): 'sale' | 'rent' | 'all'
  - `city` (string): Filter by city
  - `neighborhood` (string): Filter by neighborhood
  - `category` (string): Property category filter
  - `min_price`, `max_price` (number): Price range
  - `bedrooms` (number): Minimum bedrooms
  - `min_area`, `max_area` (number): Area range
  - `features` (array): Required features
- **Response**: Array of property objects

#### GET /api/properties/{id}
- **Purpose**: Get single property details
- **Response**: Property object with all details

#### POST /api/properties
- **Purpose**: Create new property listing
- **Body**: Property creation data
- **Response**: Created property object

#### PUT /api/properties/{id}
- **Purpose**: Update property listing
- **Body**: Updated property data
- **Response**: Updated property object

#### DELETE /api/properties/{id}
- **Purpose**: Delete property listing
- **Response**: Success confirmation

#### POST /api/properties/{id}/like
- **Purpose**: Toggle like status for property
- **Response**: Updated like count

#### POST /api/properties/{id}/comments
- **Purpose**: Add comment to property
- **Body**: Comment data
- **Response**: Created comment object

### Location API

#### GET /api/locations/cities
- **Purpose**: Get all available cities in Gabon
- **Response**: Array of city objects with neighborhoods

#### GET /api/locations/neighborhoods/{city}
- **Purpose**: Get neighborhoods for specific city
- **Response**: Array of neighborhood names

## Mocked Data in Frontend (mock.js)

Currently mocked data that needs backend implementation:

1. **Properties** (`mockProperties`):
   - 5 sample properties with full details
   - Images, prices, locations, features
   - Comments and likes data
   - Seller information

2. **Cities & Neighborhoods** (`mockCities`):
   - Libreville, Port-Gentil, Franceville, Oyem, Moanda
   - Each with realistic neighborhoods

3. **Categories** (`mockCategories`):
   - Villa, Maison, Appartement, Studio, Terrain, Bureau, Commerce

4. **Features** (`mockFeatures`):
   - Property amenities and features

## Backend Implementation Plan

### 1. Database Models (MongoDB)

#### Property Model
```python
class Property(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    price: int
    type: str  # 'sale' or 'rent'
    category: str
    bedrooms: int
    bathrooms: int
    area: int  # in square meters
    location: LocationModel
    images: List[str]  # URLs
    description: str
    features: List[str]
    created_at: datetime
    updated_at: datetime
    views: int = 0
    likes: int = 0
    seller: SellerModel
    is_active: bool = True

class LocationModel(BaseModel):
    city: str
    neighborhood: str
    coordinates: List[float]  # [latitude, longitude]

class SellerModel(BaseModel):
    name: str
    phone: str
    email: str
```

#### Comment Model
```python
class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    author: str
    content: str
    created_at: datetime
```

### 2. API Endpoints Implementation

#### Properties CRUD
- Replace mock data calls in frontend
- Implement filtering logic
- Add pagination for large datasets
- Include proper error handling

#### Search & Filtering
- Text search across title, description, location
- Advanced filtering by all property attributes
- Geographic search using coordinates

#### Social Features
- Like/unlike functionality
- Comment system
- View tracking

### 3. Frontend Integration

#### Replace Mock Data Usage
1. Update `App.js` to use actual API calls instead of `mockProperties`
2. Replace filter data with API calls
3. Implement proper error handling and loading states
4. Add form validation for property creation

#### API Integration Points
- Replace `useState(mockProperties)` with API fetch
- Update search and filter functions to call backend
- Implement like/comment API calls
- Add property creation/edit forms

### 4. Map Integration Enhancement
- Store and retrieve exact coordinates
- Implement geocoding for address to coordinates
- Add property creation via map click
- Enhance map markers with property details

## Testing Strategy

1. **Backend API Testing**:
   - Test all CRUD operations
   - Validate filtering and search
   - Test error handling

2. **Frontend Integration Testing**:
   - Verify API integration
   - Test user interactions
   - Validate responsive design

3. **Map Functionality Testing**:
   - Test marker placement
   - Verify popup interactions
   - Test coordinate accuracy

## Security Considerations

1. **Input Validation**:
   - Validate all API inputs
   - Sanitize user content
   - Image upload validation

2. **Data Protection**:
   - Hide sensitive seller information
   - Implement proper CORS
   - Rate limiting for API calls

This contract ensures seamless transition from mock data to full backend functionality while maintaining the current UI/UX experience.