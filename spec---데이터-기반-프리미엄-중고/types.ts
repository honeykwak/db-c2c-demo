export enum CategoryType {
  DIGITAL = 'DIGITAL',
  APPLIANCES = 'APPLIANCES',
  TICKET = 'TICKET',
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  children?: Category[]; // Recursive structure for CTE demo
}

export interface TicketDetails {
  artist: string;
  venue: string;
  date: string; // ISO date string
  grade: 'VIP' | 'R' | 'S' | 'A';
  sector: string;
  row: number;
  number: number;
}

export interface DeviceDetails {
  brand: string;
  model: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair'; // 미개봉, S급, etc.
  specs?: {
    storage?: string;
    ram?: string;
    processor?: string;
    year?: string;
  };
}

// JSONB Structure Simulation
export interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  category: CategoryType;
  categoryId: string;
  description: string;
  createdAt: string;
  seller: {
    name: string;
    rating: number;
    avatarUrl: string;
  };
  // This mimics the JSONB column in PostgreSQL
  details: TicketDetails | DeviceDetails;
}

export interface SkuOption {
  id: string;
  brand: string;
  model: string;
  imageUrl: string;
  specs: {
    storage?: string;
    ram?: string;
    year?: string;
  };
}