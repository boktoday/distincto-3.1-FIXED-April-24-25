import React, { useState, useRef, useEffect } from 'react';
import { FoodItem } from '../../types';
import { X, Camera } from 'lucide-react';

interface AddFoodFormProps {
  onSubmit: (foodItem: FoodItem, imageFile?: File) => void;
  onCancel: () => void;
  children: string[];
  defaultChildName: string;
}

const AddFoodForm: React.FC<AddFoodFormProps> = ({ 
  onSubmit, 
  onCancel, 
  children, 
  defaultChildName 
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'new' | 'safe' | 'sometimes' | 'notYet'>('new');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemChildName, setNewItemChildName] = useState(defaultChildName);
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [newItemImagePreview, setNewItemImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default child name when prop changes
  useEffect(() => {
    setNewItemChildName(defaultChildName);
  }, [defaultChildName]);

  // Preview for new item image
  useEffect(() => {
    if (newItemImage) {
      const objectUrl = URL.createObjectURL(newItemImage);
      setNewItemImagePreview(objectUrl);
      
      return () => {
        if (newItemImagePreview) {
          URL.revokeObjectURL(newItemImagePreview);
        }
      };
    }
  }, [newItemImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewItemImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim() || !newItemChildName.trim()) {
      setFormError('Food name and child name are required');
      return;
    }
    
    const foodItem: FoodItem = {
      id: '', // Will be set in parent component
      childName: newItemChildName,
      name: newItemName,
      category: newItemCategory,
      notes: newItemNotes,
      timestamp: 0, // Will be set in parent component
      synced: false
    };
    
    onSubmit(foodItem, newItemImage || undefined);
    
    // Reset form
    setNewItemName('');
    setNewItemCategory('new');
    setNewItemNotes('');
    setNewItemImage(null);
    setNewItemImagePreview(null);
    setFormError('');
  };

  const handleCancel = () => {
    // Clean up any object URLs
    if (newItemImagePreview) {
      URL.revokeObjectURL(newItemImagePreview);
    }
    onCancel();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Add New Food</h3>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X size={20} />
        </button>
      </div>
      
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{formError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newItemChildName" className="block text-sm font-medium text-gray-700 mb-1">
            Child Name <span className="text-red-500">*</span>
          </label>
          <select
            id="newItemChildName"
            value={newItemChildName}
            onChange={(e) => setNewItemChildName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select a child</option>
            {children.map((child) => (
              <option key={child} value={child}>
                {child}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="newItemName" className="block text-sm font-medium text-gray-700 mb-1">
            Food Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="newItemName"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="newItemCategory" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="newItemCategory"
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as 'new' | 'safe' | 'sometimes' | 'notYet')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="new">New Food</option>
            <option value="safe">Safe Food</option>
            <option value="sometimes">Sometimes Food</option>
            <option value="notYet">Not Yet Food</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="newItemNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="newItemNotes"
            value={newItemNotes}
            onChange={(e) => setNewItemNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Reactions, preferences, etc."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Camera size={16} className="mr-2" />
              {newItemImage ? 'Change Photo' : 'Add Photo'}
            </button>
            {newItemImage && (
              <span className="ml-3 text-sm text-gray-500">
                {newItemImage.name}
              </span>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          {/* Preview image */}
          {newItemImagePreview && (
            <div className="mt-3">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={newItemImagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
          >
            Add Food
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFoodForm;
