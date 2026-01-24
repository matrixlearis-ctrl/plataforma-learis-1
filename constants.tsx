
import React from 'react';
import {
  Wrench,
  Lightbulb,
  Droplets,
  Paintbrush,
  Hammer,
  Layers,
  Shovel,
  Trash2,
  Home,
  PlusCircle
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'obras', name: 'Construções e Reformas', icon: <Hammer className="w-5 h-5" /> },
  { id: 'eletrica', name: 'Eletricista', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 'telhado', name: 'Telhado', icon: <Home className="w-5 h-5" /> },
  { id: 'pintura', name: 'Pintura', icon: <Paintbrush className="w-5 h-5" /> },
  { id: 'gesso', name: 'Gesso e Drywall', icon: <Layers className="w-5 h-5" /> },
  { id: 'jardim', name: 'Jardinagem', icon: <Shovel className="w-5 h-5" /> },
  { id: 'tecnico', name: 'Climatização e ar condicionado', icon: <Wrench className="w-5 h-5" /> },
  { id: 'outros', name: 'Outros Serviços', icon: <PlusCircle className="w-5 h-5" /> },
];

export const CREDIT_PACKAGES = [
  { id: 'p1', name: 'Pack Inicial', credits: 15, price: 45.00 },
  { id: 'p2', name: 'Pack Intermediário', credits: 30, price: 75.00 },
  { id: 'p3', name: 'Pack Avançado', credits: 50, price: 135.00 },
];
