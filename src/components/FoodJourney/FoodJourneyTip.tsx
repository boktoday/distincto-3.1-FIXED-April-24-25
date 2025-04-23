import React from 'react';

const FoodJourneyTip: React.FC = () => {
  return (
    <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-600">
        <span className="font-medium">Tip:</span> Drag and drop food items between categories to update their status.
      </p>
    </div>
  );
};

export default FoodJourneyTip;
