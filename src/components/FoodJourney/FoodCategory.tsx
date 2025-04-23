import React from 'react';
import { Plus } from 'lucide-react';

interface FoodCategoryProps {
  title: string;
  color: string; // Tailwind background class, e.g., 'bg-green-100'
  itemCount: number;
  children: React.ReactNode;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
}

const FoodCategory: React.FC<FoodCategoryProps> = ({
  title,
  color,
  itemCount,
  children,
  onDrop,
  onDragOver,
  onDragLeave,
}) => {
  // --- Simplified and stricter check for color prop ---
  const safeColor = typeof color === 'string' && color.startsWith('bg-') ? color : 'bg-gray-100'; // Default background

  // --- Temporarily use fixed classes for the badge ---
  const textColorClass = 'text-gray-800';
  const badgeBgColorClass = 'bg-gray-200';

  // --- Debugging: Log the props received ---
  // console.log(`FoodCategory Render - Title: ${title}, Color: ${color}, ItemCount: ${itemCount}`);

  return (
    <div
      className={`p-4 rounded-lg shadow-sm min-h-[200px] transition-colors duration-200 ${safeColor} drag-over:ring-2 drag-over:ring-offset-2 drag-over:ring-indigo-500 flex flex-col`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {/* Use the simplified/fixed classes */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${textColorClass} ${badgeBgColorClass}`}>
          {itemCount}
        </span>
      </div>
      <div className="flex-grow space-y-3 overflow-y-auto">
        {itemCount === 0 ? (
          <p className="text-sm text-gray-500 text-center pt-10">No items</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default FoodCategory;
