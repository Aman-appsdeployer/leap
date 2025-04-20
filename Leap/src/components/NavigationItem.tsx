import * as React from 'react';
import { NavigationItemProps } from '@/types';

export const NavigationItem: React.FC<NavigationItemProps> = ({
    text,
    isActive,
  }) => (
    <div
      className={`px-4 py-2 rounded-lg ${
        isActive
          ? 'bg-cyan-500 text-black font-semibold' // Active state styling
          : 'text-white'
      } text-lg cursor-pointer hover:bg-cyan-400 hover:text-black`}
      tabIndex={0}
      role="button"
    >
      {text}
    </div>
  );
  
