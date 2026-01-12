
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
}

export interface Review {
  id: string;
  professionalId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProfessionalProfile {
  userId: string;
  description: string;
  categories: string[];
  region: string;
  rating: number;
  credits: number;
  completedJobs: number;
  phone: string;
}

export interface OrderRequest {
  id: string;
  clientId: string;
  clientName: string;
  category: string;
  description: string;
  location: string; // Cidade, UF
  neighborhood?: string; // Bairro
  deadline: string;
  status: OrderStatus;
  createdAt: string;
  leadPrice: number;
  unlockedBy: string[]; // List of professional IDs
}

export interface Lead {
  id: string;
  orderId: string;
  professionalId: string;
  cost: number;
  purchasedAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
}
