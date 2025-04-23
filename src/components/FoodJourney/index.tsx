import React, { useState, useEffect } from 'react';
import { FoodItem } from '../../types';
import dbService from '../../services/db';
import fileSystemService from '../../services/fileSystem';
import syncService from '../../services/sync';
import { Search, Plus, X } from 'lucide-react';
import FoodItemList from './FoodItemList';
import AddFoodForm from './AddFoodForm';
import FoodJourneyTip from './FoodJourneyTip';

const FoodJourney: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization

  // Effect for initial service initialization
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await dbService.initialize();
        await fileSystemService.initialize();
        console.log("FoodJourney: Services initialized.");
        setIsInitialized(true);
      } catch (err) {
        console.error('FoodJourney: Error initializing services:', err);
        setError('Failed to initialize required services. Please refresh the page.');
        setLoading(false);
      }
    };

    initializeServices();

    // Clean up object URLs when component unmounts
    return () => {
      Object.values(imageCache).forEach(url => {
        if (url) {
           try {
             URL.revokeObjectURL(url);
           } catch (e) {
             console.warn("Error revoking object URL:", e);
           }
        }
      });
    };
  }, []); // Runs only once on mount

  // Effect to load data *after* services are initialized or selectedChild changes
  useEffect(() => {
    if (isInitialized) {
      console.log(`FoodJourney: useEffect triggered. Initialized: ${isInitialized}, Selected Child: ${selectedChild}. Loading data...`);
      // Load children (could optimize to run less often if children list is stable)
      loadChildren();
      // Load food items based on current selected child
      loadFoodItems();
    }
  }, [isInitialized, selectedChild]); // Rerun when initialized or child changes

  const loadFoodItems = async () => {
    if (!isInitialized) {
      console.log("FoodJourney: loadFoodItems skipped - not initialized.");
      return;
    }

    setLoading(true);
    setError('');
    const childToLoad = selectedChild; // Capture the state at the time of function call
    console.log(`FoodJourney: Loading food items for child: ${childToLoad || 'All'}`);

    try {
      const items = await dbService.getFoodItems(childToLoad || undefined);
      // --- Safety Check: Only update state if the selected child hasn't changed during the async fetch ---
      // This prevents race conditions if the user rapidly changes the dropdown.
      if (childToLoad === selectedChild) {
          setFoodItems(items);
          console.log(`FoodJourney: Loaded ${items.length} food items for ${childToLoad || 'All'}. Updating state.`);
          await loadImageCache(items); // Load images for the fetched items
      } else {
          console.log(`FoodJourney: Stale data ignored. Selected child changed from ${childToLoad} to ${selectedChild} during fetch.`);
      }

    } catch (err) {
      console.error('FoodJourney: Error loading food items:', err);
      setError('Failed to load food items. Please try again.');
    } finally {
      // --- Safety Check: Only stop loading if the selected child hasn't changed ---
      if (childToLoad === selectedChild) {
          setLoading(false);
      }
    }
  };

  // Helper function to manage image cache loading and cleanup
  const loadImageCache = async (items: FoodItem[]) => {
      const newImageCache: Record<string, string> = {};
      const currentImageCache = { ...imageCache }; // Copy current cache

      const imageLoadPromises = items.map(async (item) => {
        if (item.imageFile && !currentImageCache[item.id]) { // Only load if image exists and not already cached
          try {
            const imageBlob = await fileSystemService.getFile(item.imageFile);
            if (imageBlob) {
              newImageCache[item.id] = URL.createObjectURL(imageBlob);
            }
          } catch (err) {
            console.error(`Error loading image for ${item.name} (${item.imageFile}):`, err);
          }
        } else if (item.imageFile && currentImageCache[item.id]) {
           // Keep existing cached URL if valid
           newImageCache[item.id] = currentImageCache[item.id];
        }
      });

      await Promise.all(imageLoadPromises);

      // Revoke URLs that are no longer needed from the *previous* cache
      Object.keys(currentImageCache).forEach(itemId => {
        if (!newImageCache[itemId] && currentImageCache[itemId]) {
          try {
            URL.revokeObjectURL(currentImageCache[itemId]);
          } catch (e) {
            console.warn("Error revoking object URL during cache update:", e);
          }
        }
      });

      setImageCache(newImageCache); // Update the image cache state
      console.log("FoodJourney: Image cache updated.");
  };


  const loadChildren = async () => {
     if (!isInitialized) return;

     try {
       console.log("FoodJourney: Loading children names...");
       const journalEntries = await dbService.getJournalEntries();
       const uniqueChildren = Array.from(new Set(journalEntries.map(entry => entry.childName).filter(name => !!name)));
       setChildren(uniqueChildren);
       console.log("FoodJourney: Found children:", uniqueChildren);

       // Set the first child as selected only if no child is currently selected AND children exist
       if (uniqueChildren.length > 0 && !selectedChild) {
          console.log("FoodJourney: Setting default selected child:", uniqueChildren[0]);
          // --- CHANGE: Use functional update for setSelectedChild to avoid potential stale state issues ---
          setSelectedChild(prevSelected => {
            if (!prevSelected && uniqueChildren.length > 0) {
              return uniqueChildren[0];
            }
            return prevSelected; // Keep current selection if already set
          });
       } else if (uniqueChildren.length === 0 && selectedChild) {
          // If no children are found but one was previously selected, clear selection
          console.log("FoodJourney: No children found, clearing selection.");
          setSelectedChild('');
       }
     } catch (err) {
       console.error('FoodJourney: Error loading children:', err);
     }
   };


  const handleAddFoodItem = async (newFoodItemData: Omit<FoodItem, 'id' | 'timestamp' | 'synced'>, imageFile?: File) => {
    if (!isInitialized) {
       setError("Cannot add item: Services not ready.");
       return;
    }
    setError('');
    console.log(`FoodJourney: handleAddFoodItem called for child: ${newFoodItemData.childName}`);

    try {
      let imageFilePath: string | undefined;

      if (imageFile) {
        if (!newFoodItemData.childName) {
          throw new Error("Child name is required to save an image.");
        }
        const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
        console.log(`FoodJourney: Saving image for ${newFoodItemData.name}: ${fileName}`);
        imageFilePath = await fileSystemService.saveFile(newFoodItemData.childName, fileName, imageFile);
        console.log(`FoodJourney: Image saved to path: ${imageFilePath}`);
      }

      const foodItem: FoodItem = {
        ...newFoodItemData,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        imageFile: imageFilePath,
        synced: false
      };

      console.log("FoodJourney: Saving new food item:", foodItem);
      await dbService.saveFoodItem(foodItem);
      console.log("FoodJourney: Food item saved successfully.");

      await syncService.registerForSync();
      setShowAddForm(false);

      const childAddedFor = foodItem.childName;
      console.log(`FoodJourney: Item added for ${childAddedFor}. Current view is for ${selectedChild}.`);
      if (selectedChild !== childAddedFor) {
          console.log(`FoodJourney: Switching selected child view to ${childAddedFor}.`);
          setSelectedChild(childAddedFor); // This triggers useEffect which calls loadFoodItems
      } else {
          console.log("FoodJourney: Already viewing the correct child. Reloading food items...");
          await loadFoodItems(); // Reload directly if view doesn't need to change
      }

    } catch (err) {
      console.error('FoodJourney: Error adding food item:', err);
      setError(`Failed to add food item: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteFoodItem = async (itemId: string) => {
     if (!isInitialized) {
        setError("Cannot delete item: Services not ready.");
        return;
     }
     setError('');

     try {
       const itemFromDb = await dbService.getFoodItem(itemId);

       if (itemFromDb) {
         console.log(`FoodJourney: Deleting food item: ${itemFromDb.name} (${itemId}) for child ${itemFromDb.childName}`);

         // Delete associated image file if it exists
         if (itemFromDb.imageFile) {
           try {
             console.log(`FoodJourney: Deleting associated image: ${itemFromDb.imageFile}`);
             await fileSystemService.deleteFile(itemFromDb.imageFile);
             console.log(`FoodJourney: Image deleted successfully.`);
           } catch (err) {
             console.error(`FoodJourney: Error deleting image file ${itemFromDb.imageFile}:`, err);
           }

           // Clean up image cache
           if (imageCache[itemId]) {
             URL.revokeObjectURL(imageCache[itemId]);
             const newImageCache = { ...imageCache };
             delete newImageCache[itemId];
             setImageCache(newImageCache);
           }
         }

         await dbService.deleteFoodItem(itemId);
         console.log(`FoodJourney: Food item ${itemId} deleted from DB.`);
         await syncService.registerForSync();
         console.log("FoodJourney: Reloading food items after delete...");
         await loadFoodItems();

       } else {
          console.warn(`FoodJourney: Item with ID ${itemId} not found for deletion.`);
          await loadFoodItems(); // Reload just in case
       }
     } catch (err) {
       console.error('FoodJourney: Error deleting food item:', err);
       setError('Failed to delete food item. Please try again.');
       await loadFoodItems();
     }
   };


  const handleUpdateFoodCategory = async (itemId: string, category: 'new' | 'safe' | 'sometimes' | 'notYet') => {
    if (!isInitialized) {
       setError("Cannot update category: Services not ready.");
       return;
    }
    setError('');

    try {
      const itemToUpdate = await dbService.getFoodItem(itemId);

      if (itemToUpdate && itemToUpdate.category !== category) {
        console.log(`FoodJourney: Updating category for ${itemToUpdate.name} (${itemId}) to ${category}`);
        const updatedItem: FoodItem = {
          ...itemToUpdate,
          category,
          timestamp: Date.now(),
          synced: false
        };

        await dbService.saveFoodItem(updatedItem);
        console.log(`FoodJourney: Category updated successfully in DB.`);
        await syncService.registerForSync();
        console.log("FoodJourney: Reloading food items after category update...");
        await loadFoodItems();

      } else if (itemToUpdate && itemToUpdate.category === category) {
         console.log(`FoodJourney: Category for ${itemId} is already ${category}. No update needed.`);
      } else {
         console.warn(`FoodJourney: Item with ID ${itemId} not found for category update.`);
         await loadFoodItems();
      }
    } catch (err) {
      console.error('FoodJourney: Error updating food item category:', err);
      setError('Failed to update food item category. Please try again.');
      await loadFoodItems();
    }
  };

  // --- Handler for updating food item notes ---
  const handleUpdateFoodNotes = async (itemId: string, newNotes: string) => {
    if (!isInitialized) {
      setError("Cannot update notes: Services not ready.");
      return;
    }
    setError('');

    try {
      const itemToUpdate = await dbService.getFoodItem(itemId);

      if (itemToUpdate) {
        // Only proceed if notes actually changed
        if (itemToUpdate.notes !== newNotes) {
          console.log(`FoodJourney: Updating notes for ${itemToUpdate.name} (${itemId})`);
          const updatedItem: FoodItem = {
            ...itemToUpdate,
            notes: newNotes,
            timestamp: Date.now(), // Update timestamp on modification
            synced: false
          };

          await dbService.saveFoodItem(updatedItem);
          console.log(`FoodJourney: Notes updated successfully in DB.`);
          await syncService.registerForSync();
          console.log("FoodJourney: Reloading food items after notes update...");
          await loadFoodItems(); // Reload to show the updated notes
        } else {
          console.log(`FoodJourney: Notes for ${itemId} haven't changed. No update needed.`);
        }
      } else {
        console.warn(`FoodJourney: Item with ID ${itemId} not found for notes update.`);
        await loadFoodItems(); // Reload to sync state if item not found
      }
    } catch (err) {
      console.error('FoodJourney: Error updating food item notes:', err);
      setError('Failed to update food item notes. Please try again.');
      await loadFoodItems(); // Optionally reload items even on error
    }
  };


  // Filter items based on search term (client-side filtering)
  const filteredItems = foodItems.filter(item => {
    if (!searchTerm) return true;
    if (selectedChild && item.childName !== selectedChild) return false;
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group items by category after filtering
  const categorizedItems = {
    new: filteredItems.filter(item => item.category === 'new'),
    safe: filteredItems.filter(item => item.category === 'safe'),
    sometimes: filteredItems.filter(item => item.category === 'sometimes'),
    notYet: filteredItems.filter(item => item.category === 'notYet')
  };

  return (
    <div className="space-y-8 mt-12 px-4 pb-16"> {/* Added padding bottom */}
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Child Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="childFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Child:
          </label>
          <select
            id="childFilter"
            value={selectedChild}
            onChange={(e) => {
                console.log("FoodJourney: Child filter changed to:", e.target.value);
                setSelectedChild(e.target.value); // This triggers the useEffect hook
            }}
            className="flex-grow sm:flex-grow-0 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
            disabled={!isInitialized || loading || children.length === 0} // Disable while loading
          > {/* Removed the erroneous ```html tag */}
            <option value="">All Children</option>
            {children.map((child) => (
              <option key={child} value={child}>
                {child}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-grow w-full sm:w-auto sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Client-side filtering, no reload needed
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            disabled={!isInitialized || loading} // Disable while loading
          />
        </div>

        {/* Add Food Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-raspberry hover:bg-raspberry-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry disabled:opacity-50"
          disabled={!isInitialized || loading} // Disable while loading
        >
          <Plus size={16} className="mr-2" />
          Add Food
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
           <button
              onClick={() => setError('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              aria-label="Close error"
           >
              <X size={18} className="text-red-700 hover:text-red-900"/>
           </button>
        </div>
      )}

      {/* Add Food Form */}
      {showAddForm && (
        <div className="mb-8 p-4 border rounded-md shadow-sm bg-white">
          <AddFoodForm
            onSubmit={handleAddFoodItem}
            onCancel={() => setShowAddForm(false)}
            children={children}
            // Pass the currently selected child as the initial default for the form
            defaultChildName={selectedChild}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-raspberry"></div>
          <p className="mt-4 text-gray-600">Loading food items...</p>
        </div>
      )}

      {/* Food Item List (only render if not loading and initialized) */}
      {!loading && isInitialized && (
        <div className="mt-8">
          <FoodItemList
            categorizedItems={categorizedItems}
            imageCache={imageCache}
            onUpdateCategory={handleUpdateFoodCategory}
            onDeleteItem={handleDeleteFoodItem}
            onUpdateNotes={handleUpdateFoodNotes} // Pass the new handler
          />
          {/* Show message if no items match filters */}
          {foodItems.length > 0 && filteredItems.length === 0 && searchTerm && (
             <p className="text-center text-gray-500 mt-6">No food items match your search term "{searchTerm}".</p>
          )}
          {/* Show message if no items exist for the selected child */}
          {foodItems.length === 0 && !searchTerm && !loading && ( // Added !loading check
             <p className="text-center text-gray-500 mt-6">
               {selectedChild ? `No food items recorded for ${selectedChild} yet.` : "No food items recorded yet."}
               {!selectedChild && children.length === 0 && " Add a child in the Journal section first."}
               {(selectedChild || children.length > 0) && (
                 <button onClick={() => setShowAddForm(true)} className="ml-2 text-raspberry hover:underline">Add the first one!</button>
               )}
             </p>
          )}
        </div>
      )}

      {/* Food Journey Tip (only render if initialized) */}
      {isInitialized && (
        <div className="mt-8">
          <FoodJourneyTip />
        </div>
      )}
    </div>
  );
};

export default FoodJourney;
