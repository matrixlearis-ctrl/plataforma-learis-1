
import React from 'react';
import { 
  Wrench, 
  Lightbulb, 
  Droplets, 
  Paintbrush, 
  Hammer, 
  Shovel, 
  Trash2, 
  Home 
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'obras', name: 'Construções e Reformas', icon: <Hammer className="w-5 h-5" /> },
  { id: 'eletrica', name: 'Eletricista', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 'encanamento', name: 'Impermeabilizações', icon: <Droplets className="w-5 h-5" /> },
  { id: 'pintura', name: 'Pintura', icon: <Paintbrush className="w-5 h-5" /> },
  { id: 'limpeza', name: 'Limpeza', icon: <Trash2 className="w-5 h-5" /> },
  { id: 'jardim', name: 'Jardinagem', icon: <Shovel className="w-5 h-5" /> },
  { id: 'tecnico', name: 'Climatização e ar condicionado', icon: <Wrench className="w-5 h-5" /> },
  { id: 'outros', name: 'Outros Serviços', icon: <Home className="w-5 h-5" /> },
];

export const CREDIT_PACKAGES = [
  { id: 'p1', name: 'Pack Básico', credits: 10, price: 29.90 },
  { id: 'p2', name: 'Pack Profissional', credits: 30, price: 79.90 },
  { id: 'p3', name: 'Pack Premium', credits: 100, price: 199.90 },
];
