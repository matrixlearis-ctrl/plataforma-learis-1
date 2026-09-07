
export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  document?: string;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  name: string;
  description: string;
  categories: string[];
  region: string;
  location?: string;
  rating: number;
  credits: number;
  completedJobs: number;
  phone: string;
  avatar?: string;
  bio?: string;
  portfolioUrls?: string[];
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  experience?: string;
  profession?: string;
}

export interface OrderRequest {
  id: string;
  clientId: string;
  clientName: string;
  category: string;
  description: string;
  phone: string;
  address?: string;
  number?: string;
  complement?: string;
  location: string;
  neighborhood?: string;
  deadline: string;
  status: OrderStatus;
  createdAt: string;
  leadPrice: number;
  unlockedBy: string[];
  imageUrl?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  user_name?: string;
  amount: number;
  credits: number;
  status: 'pending' | 'approved' | 'cancelled';
  mercadopago_id: string;
  description: string;
  created_at: string;
}
