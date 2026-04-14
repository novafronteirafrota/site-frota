export type UserRole = 'admin' | 'moderator' | 'member';

export interface User {
  id: string;
  username: string;
  display_name: string;
  photo_url?: string | null;
  role: UserRole;
  created_at: string;
}

export interface Ship {
  id: string;
  ship_slug: string;
  name: string;
  photo_url?: string | null;
  manufacturer?: string | null;
  created_at: string;
}

export interface UserFleetItem {
  id: string;
  user_id: string;
  ship_id: string;
  ship: Ship;
  quantity: number;
}

export interface FleetAggregation {
  ship: Ship;
  totalQuantity: number;
  owners: {
    user: User;
    quantity: number;
  }[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
