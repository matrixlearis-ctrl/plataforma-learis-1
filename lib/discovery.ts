import { supabase } from './supabase';
import {
  ProfileExtended, ProfessionalCardItem, CompanyCardItem,
  ServiceCategoryItem, ServiceItem, SocialProfileSummary,
} from '../types';

const mapProfile = (a: any): SocialProfileSummary => ({
  id: a.id,
  username: a.username,
  full_name: a.full_name,
  avatar_url: a.avatar_url,
  cover_url: a.cover_url,
  cover_position: a.cover_position,
  description: a.description,
  city: a.city,
  state: a.state,
  role: a.role,
  profession: a.profession,
  verified: a.verified,
  created_at: a.created_at,
});

const mapProfileIds = async (): Promise<Record<string, SocialProfileSummary>> => {
  const { data } = await supabase
    .from('public_profiles')
    .select('id, username, full_name, avatar_url, cover_url, description, city, state, role, profession, verified, created_at');
  const map: Record<string, SocialProfileSummary> = {};
  (data || []).forEach((a: any) => { map[a.id] = mapProfile(a); });
  return map;
};

export const getServiceCategories = async (): Promise<ServiceCategoryItem[]> => {
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name, slug, icon, order_index')
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    orderIndex: c.order_index,
  }));
};

export const getServicesByCategory = async (): Promise<Record<string, ServiceItem[]>> => {
  const { data, error } = await supabase
    .from('services')
    .select('id, category_id, name, slug')
    .eq('active', true)
    .order('name', { ascending: true });
  if (error) return {};
  const map: Record<string, ServiceItem[]> = {};
  (data || []).forEach((s: any) => {
    (map[s.category_id] = map[s.category_id] || []).push({
      id: s.id,
      categoryId: s.category_id,
      name: s.name,
      slug: s.slug,
    });
  });
  return map;
};

export const getProfessionals = async (): Promise<ProfessionalCardItem[]> => {
  const [{ data: rows }, profileMap] = await Promise.all([
    supabase
      .from('public_professionals')
      .select('id, profile_id, profession, specialties, experience_years, formation, description, city, state')
      .order('created_at', { ascending: false }),
    mapProfileIds(),
  ]);
  if (!rows) return [];
  return rows.map((r: any) => ({
    id: r.id,
    profileId: r.profile_id,
    profile: profileMap[r.profile_id] || { id: r.profile_id, role: '' },
    profession: r.profession,
    specialties: r.specialties,
    experienceYears: r.experience_years,
    formation: r.formation,
    description: r.description,
    city: r.city,
    state: r.state,
  }));
};

export const getCompanies = async (): Promise<CompanyCardItem[]> => {
  const [{ data: rows }, profileMap] = await Promise.all([
    supabase
      .from('public_companies')
      .select(
        'id, profile_id, company_name, description, logo_url, cover_url, city, state, website, social_links, team',
      )
      .order('created_at', { ascending: false }),
    mapProfileIds(),
  ]);
  if (!rows) return [];
  return rows.map((r: any) => ({
    id: r.id,
    profileId: r.profile_id,
    profile: profileMap[r.profile_id] || { id: r.profile_id, role: '' },
    companyName: r.company_name,
    description: r.description,
    logoUrl: r.logo_url,
    coverUrl: r.cover_url,
    city: r.city,
    state: r.state,
    website: r.website,
  }));
};

export const getProfileExtended = async (profileId: string): Promise<ProfileExtended | null> => {
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, username, full_name, avatar_url, cover_url, cover_position, description, city, state, role, profession, verified, created_at')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile) return null;

  const p = mapProfile(profile);
  const [{ data: pro }, { data: comp }, serviceRows, catMap] = await Promise.all([
    supabase
      .from('public_professionals')
      .select('id, profile_id, profession, specialties, experience_years, formation, description, city, state')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('public_companies')
      .select('id, profile_id, company_name, description, logo_url, cover_url, city, state, website, social_links, team')
      .eq('profile_id', profileId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('services')
      .select('id, category_id, name, slug'),
    getServiceCategories(),
  ]);

  const serviceItems: ServiceItem[] = (serviceRows?.data || []).map((s: any) => ({
    id: s.id,
    categoryId: s.category_id,
    name: s.name,
    slug: s.slug,
  }));

  const dedup = (list: ServiceItem[]): ServiceItem[] => {
    const seen = new Set<string>();
    return list.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  };

  let services: ServiceItem[] = dedup(serviceItems);
  let categories: ServiceCategoryItem[] = [];
  if (services.length === 0) {
    categories = catMap.slice(0, 4);
  } else {
    const cats = new Map(catMap.map((c) => [c.id, c]));
    categories = [...new Set(services.map((s) => s.categoryId))]
      .map((id) => cats.get(id))
      .filter(Boolean) as ServiceCategoryItem[];
  }

  return {
    profile: p,
    professional: pro
      ? {
          id: pro.id,
          profession: pro.profession,
          specialties: pro.specialties,
          experienceYears: pro.experience_years,
          formation: pro.formation,
          description: pro.description,
          city: pro.city,
          state: pro.state,
        }
      : undefined,
    company: comp
      ? {
          id: comp.id,
          companyName: comp.company_name,
          description: comp.description,
          logoUrl: comp.logo_url,
          coverUrl: comp.cover_url,
          city: comp.city,
          state: comp.state,
          website: comp.website,
        }
      : undefined,
    services,
    categories,
  };
};

export const getSuggestions = async (
  limit = 4,
): Promise<{ professionals: ProfessionalCardItem[]; companies: CompanyCardItem[] }> => {
  const [pros, comps] = await Promise.all([getProfessionals(), getCompanies()]);
  return {
    professionals: pros.slice(0, limit),
    companies: comps.slice(0, limit),
  };
};