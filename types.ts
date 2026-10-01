
export enum UserRole {
  CLIENT = 'CLIENT',
  USER = 'USER',
  PROFESSIONAL = 'PROFESSIONAL',
  COMPANY = 'COMPANY',
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
  document?: string;
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

export interface SocialProfileSummary {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  cover_url?: string;
  cover_position?: string;
  description?: string;
  role: string;
  profession?: string;
  verified?: boolean;
  city?: string;
  state?: string;
  created_at?: string;
}

export interface SocialPostMedia {
  id: string;
  kind: 'image' | 'video';
  url: string;
  thumb_url?: string;
  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
  order_index: number;
}

export interface SocialPost {
  id: string;
  authorId: string;
  author?: SocialProfileSummary;
  caption?: string;
  location?: string;
  hashtags: string[];
  status: string;
  createdAt: string;
  media: SocialPostMedia[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
}

export interface SocialComment {
  id: string;
  postId: string;
  authorId: string;
  author?: SocialProfileSummary;
  content: string;
  createdAt: string;
}

export interface ProfessionalCardItem {
  id: string;
  profileId: string;
  profile: SocialProfileSummary;
  profession?: string;
  specialties?: string[];
  experienceYears?: number;
  formation?: string;
  description?: string;
  city?: string;
  state?: string;
}

export interface CompanyCardItem {
  id: string;
  profileId: string;
  profile: SocialProfileSummary;
  companyName?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  city?: string;
  state?: string;
  website?: string;
}

export interface ServiceCategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  orderIndex?: number;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
}

export interface ProfileExtended {
  profile: SocialProfileSummary;
  professional?: Omit<ProfessionalCardItem, 'profile' | 'profileId'>;
  company?: Omit<CompanyCardItem, 'profile' | 'profileId'>;
  services: ServiceItem[];
  categories: ServiceCategoryItem[];
}

export interface NotificationItem {
  id: string;
  profileId: string;
  actorId?: string;
  type?: string;
  refType?: string;
  refId?: string;
  message?: string;
  readAt?: string | null;
  createdAt: string;
}
