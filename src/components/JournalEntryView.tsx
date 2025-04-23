import React from 'react';
import { JournalEntry } from '../types';
import { X, Edit, Calendar } from 'lucide-react';

interface JournalEntryViewProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: () => void;
}

const JournalEntryView: React.FC<JournalEntryViewProps> = ({ entry, onClose, onEdit }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSection = (title: string, content: string | undefined) => {
    // Check if content is defined and not just whitespace
    if (!content || !content.trim()) return null;

    return (
      <div className="mb-6">
        <h3 className="text-md font-semibold text-raspberry mb-2">{title}</h3>
        <p className="text-gray-700 whitespace-pre-line">{content}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{entry.childName}</h2>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <Calendar size={14} className="mr-1" />
              {formatDate(entry.timestamp)}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Edit entry"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 flex-grow overflow-y-auto">
          {renderSection("Medication Notes", entry.medicationNotes)}
          {renderSection("Education Notes", entry.educationNotes)}
          {renderSection("Social Engagement Notes", entry.socialEngagementNotes)}
          {renderSection("Sensory Profile Notes", entry.sensoryProfileNotes)}
          {renderSection("Food & Nutrition Notes", entry.foodNutritionNotes)}
          {renderSection("Behavioral Notes", entry.behavioralNotes)}
          {renderSection("Sleep Notes", entry.sleepNotes)} {/* Display Sleep Notes */}
          {renderSection("Magic Moments", entry.magicMoments)}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary mr-3"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="btn-primary"
          >
            Edit Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalEntryView;
