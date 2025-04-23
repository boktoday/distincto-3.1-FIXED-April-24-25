import React, { useState, useRef, useEffect } from 'react';
import { FoodItem } from '../../types';
import { Move, Camera, MoreVertical, Trash2, Edit3, Save, X } from 'lucide-react';

interface FoodItemCardProps {
  item: FoodItem;
  imageUrl?: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDelete: () => void;
  onUpdateNotes: (itemId: string, newNotes: string) => void; // New prop
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({
  item,
  imageUrl,
  onDragStart,
  onDragEnd,
  onDelete,
  onUpdateNotes // Destructure new prop
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [editedNotes, setEditedNotes] = useState(item.notes || ''); // State for edited notes
  const menuRef = useRef<HTMLDivElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null); // Ref for textarea focus

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowDeleteConfirm(false);
        // Don't cancel edit mode on outside click, only menu/delete confirm
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && notesTextareaRef.current) {
      notesTextareaRef.current.focus();
      notesTextareaRef.current.select(); // Select text for easy replacement
    }
  }, [isEditing]);


  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering drag or other parent events
    setIsMenuOpen(!isMenuOpen);
    setShowDeleteConfirm(false); // Close delete confirm if opening menu
    // Don't affect edit mode here
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedNotes(item.notes || ''); // Initialize with current notes
    setIsEditing(true);
    setIsMenuOpen(false); // Close menu
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNotes(item.id, editedNotes); // Call parent handler
    setIsEditing(false); // Exit edit mode
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false); // Exit edit mode
    setEditedNotes(item.notes || ''); // Reset notes to original
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedNotes(e.target.value);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setIsMenuOpen(false); // Close menu
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowDeleteConfirm(false); // Close confirmation after delete
  };

  // Prevent drag from starting when interacting with input/buttons inside the card
  const stopPropagation = (e: React.MouseEvent | React.FocusEvent | React.ChangeEvent) => {
      e.stopPropagation();
  };
   const stopDragPropagation = (e: React.DragEvent) => {
       e.stopPropagation();
   };


  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-3 mb-2 relative ${isEditing ? 'cursor-default' : 'cursor-move'}`}
      draggable={!isEditing} // Only draggable when not editing
      onDragStart={isEditing ? stopDragPropagation : onDragStart} // Prevent drag start in edit mode
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start"> {/* Changed to items-start for better alignment with textarea */}
        {/* Drag Handle */}
        <div
           className={`mr-2 text-gray-400 flex-shrink-0 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
           // Prevent drag handle from working in edit mode visually/functionally
           style={{ paddingTop: '0.25rem' }} // Align roughly with top of image/text
        >
          <Move size={16} />
        </div>

        {/* Image */}
        <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Camera size={16} />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          <h4 className="font-medium text-raspberry">{item.name}</h4>
          {isEditing ? (
            // Edit Mode for Notes
            <div className="mt-1" onClick={stopPropagation} onMouseDown={stopPropagation}>
              <textarea
                ref={notesTextareaRef}
                value={editedNotes}
                onChange={handleNotesChange}
                rows={3}
                className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Add notes..."
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={handleCancelClick}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClick}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                  disabled={editedNotes === (item.notes || '')} // Disable if no changes
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            // View Mode for Notes
            item.notes && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.notes}</p>
          )}
        </div>

        {/* Item menu button (only show if not editing) */}
        {!isEditing && (
          <div className="relative ml-2 flex-shrink-0" ref={menuRef}>
            <button
              onClick={toggleMenu}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <MoreVertical size={16} />
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 py-1">
                 {/* Edit Button */}
                 <button
                    onClick={handleEditClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                 >
                    <Edit3 size={14} className="mr-2" />
                    Edit Notes
                 </button>
                 {/* Delete Button */}
                <button
                  onClick={confirmDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </button>
              </div>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-10 p-3">
                <p className="text-sm mb-3">Are you sure you want to delete "{item.name}"?</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelDelete}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodItemCard;
