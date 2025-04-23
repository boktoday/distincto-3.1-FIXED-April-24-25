import React, { useState } from 'react';
import { FoodItem } from '../../types';
import FoodCategory from './FoodCategory';
import FoodItemCard from './FoodItemCard';

interface FoodItemListProps {
  categorizedItems: {
    new: FoodItem[];
    safe: FoodItem[];
    sometimes: FoodItem[];
    notYet: FoodItem[];
  };
  imageCache: Record<string, string>;
  onUpdateCategory: (itemId: string, category: 'new' | 'safe' | 'sometimes' | 'notYet') => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateNotes: (itemId: string, newNotes: string) => void; // New prop
}

const FoodItemList: React.FC<FoodItemListProps> = ({
  categorizedItems,
  imageCache,
  onUpdateCategory,
  onDeleteItem,
  onUpdateNotes // Destructure new prop
}) => {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: Add a class for visual feedback during drag
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItemId(null);
    // Optional: Remove visual feedback class
    e.currentTarget.classList.remove('dragging');
  };

  const handleDrop = (e: React.DragEvent, targetCategory: 'new' | 'safe' | 'sometimes' | 'notYet') => {
    e.preventDefault();
    if (draggedItemId) {
      onUpdateCategory(draggedItemId, targetCategory);
    }
    // Optional: Remove drop zone highlight
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow drop
    e.dataTransfer.dropEffect = 'move';
    // Optional: Add highlight to drop zone
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Optional: Remove highlight when dragging out
    e.currentTarget.classList.remove('drag-over');
  };

  const categories: { key: 'new' | 'safe' | 'sometimes' | 'notYet'; title: string; color: string }[] = [
    { key: 'new', title: 'New Food', color: 'bg-green-100' },
    { key: 'safe', title: 'Safe Food', color: 'bg-blue-100' },
    { key: 'sometimes', title: 'Sometimes Food', color: 'bg-yellow-100' },
    { key: 'notYet', title: 'Not Yet Food', color: 'bg-red-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categories.map(({ key, title, color }) => (
        <FoodCategory
          key={key}
          title={title}
          color={color}
          itemCount={categorizedItems[key].length}
          onDrop={(e) => handleDrop(e, key)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {categorizedItems[key].map((item) => (
            <FoodItemCard
              key={item.id}
              item={item}
              imageUrl={imageCache[item.id]}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragEnd={handleDragEnd}
              onDelete={() => onDeleteItem(item.id)}
              onUpdateNotes={onUpdateNotes} // Pass down the handler
            />
          ))}
        </FoodCategory>
      ))}
    </div>
  );
};

export default FoodItemList;
