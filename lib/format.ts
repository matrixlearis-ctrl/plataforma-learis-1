import { UserRole } from '../types';

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const roleLabel = (role?: string): string => {
  switch (role) {
    case UserRole.PROFESSIONAL: return 'Profissional';
    case UserRole.COMPANY: return 'Empresa';
    case UserRole.CLIENT: return 'Cliente';
    case UserRole.ADMIN: return 'Admin';
    default: return 'Usuário';
  }
};

export const roleBadgeClass = (role?: string): string => {
  switch (role) {
    case UserRole.PROFESSIONAL: return 'bg-orange-50 text-brand-orange border-orange-100';
    case UserRole.COMPANY: return 'bg-brand-blue/5 text-brand-blue border-brand-blue/10';
    case UserRole.ADMIN: return 'bg-purple-50 text-purple-700 border-purple-100';
    default: return 'bg-gray-50 text-gray-500 border-gray-100';
  }
};

export const formatRelative = (iso?: string): string => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return formatFullDate(iso);
};

export const formatFullDate = (iso?: string): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '');
};

export const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} mi`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} mil`;
  return String(n);
};

export const joinLocation = (city?: string, state?: string): string => {
  const parts = [city, state].filter(Boolean).map((s) => s?.trim());
  return parts.join(' · ') || '';
};