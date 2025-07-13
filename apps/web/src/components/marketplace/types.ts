export interface GigData {
  id: number;
  uuid: string;
  title: string;
  category: string;
  subcategory?: string;
  startingPrice: number;
  currency: string;
  avgRating?: number;
  totalOrders: number;
  totalReviews: number;
  featured: boolean;
  status: string;
  publishedAt?: string;
  talent: {
    id: number;
    uuid: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  _count: {
    bookings: number;
    reviews: number;
  };
}

export interface MarketplaceFilters {
  page: number;
  limit: number;
  search: string;
  category: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  deliveryTime?: number;
  talentLevel?: string;
  avgRating?: number;
  sortBy: 'popularity' | 'rating' | 'price' | 'orders' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
}

export interface MarketplaceData {
  gigs: GigData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  categories?: Array<{
    name: string;
    count: number;
    subcategories?: Array<{
      name: string;
      count: number;
    }>;
  }>;
  featured?: GigData[];
}

export interface Category {
  name: string;
  count: number;
  icon?: string;
  subcategories?: Array<{
    name: string;
    count: number;
  }>;
}

export interface GigBooking {
  id: number;
  uuid: string;
  gigId: number;
  clientId: number;
  packageIndex: number;
  selectedExtras?: number[];
  customRequirements?: string;
  urgentDelivery: boolean;
  totalPrice: number;
  currency: string;
  deliveryDate: string;
  status: 'pending' | 'active' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
  updatedAt: string;
}

export interface GigReview {
  id: number;
  uuid: string;
  bookingId: number;
  gigId: number;
  reviewerId: number;
  rating: number;
  title: string;
  comment: string;
  categories: {
    communication: number;
    quality: number;
    delivery: number;
    value: number;
  };
  wouldRecommend: boolean;
  createdAt: string;
  updatedAt: string;
}