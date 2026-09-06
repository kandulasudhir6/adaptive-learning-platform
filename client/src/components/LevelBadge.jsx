import React from 'react';
import { Shield, Award, Zap } from 'lucide-react';

export default function LevelBadge({ level, size = 'md' }) {
  const normLevel = (level || 'beginner').toLowerCase();

  const configs = {
    beginner: {
      label: 'Level 1: Beginner',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: Shield,
    },
    intermediate: {
      label: 'Level 2: Intermediate',
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: Award,
    },
    advanced: {
      label: 'Level 3: Advanced',
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: Zap,
    },
  };

  const current = configs[normLevel] || configs.beginner;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <IconComponent className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {current.label}
    </span>
  );
}
