import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import dbService from '../services/db';
import encryptionService from '../services/encryption';
import { JournalEntry } from '../types';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import JournalEntryView from './JournalEntryView';

const JournalList: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showEntryView, setShowEntryView] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  const fetchEntries = async () => {
    console.log('JournalList: Fetching entries...'); // Add log
    try {
      setLoading(true);
      setError(null);
      
      await dbService.initialize();
      const journalEntries = await dbService.getAllJournalEntries();
      console.log(`JournalList: Fetched ${journalEntries.length} raw entries.`); // Add log
      
      // Decrypt sensitive data
      const decryptedEntries = await Promise.all(
        journalEntries.map(async (entry) => {
          try {
            // Only decrypt if medicationNotes exists and is not empty
            const decryptedMedicationNotes = (entry.medicationNotes && typeof entry.medicationNotes === 'string' && entry.medicationNotes.length > 0)
              ? await encryptionService.decrypt(entry.medicationNotes)
              : entry.medicationNotes; // Keep as is if null, undefined, or empty

            return {
              ...entry,
              medicationNotes: decryptedMedicationNotes
            };
          } catch (err) {
            console.error(`Error decrypting entry ID ${entry.id}:`, err);
            // Return entry with original (potentially encrypted or null) notes on error
            return entry; 
          }
        })
      );
      
      // Sort by timestamp, newest first
      const sortedEntries = decryptedEntries.sort((a, b) => b.timestamp - a.timestamp);
      console.log(`JournalList: Setting ${sortedEntries.length} sorted entries.`); // Add log
      setEntries(sortedEntries);
      // Apply search filter immediately after fetching and sorting
      filterEntries(searchQuery, sortedEntries); 

    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError('Failed to load journal entries. Please try again.');
    } finally {
      setLoading(false);
      console.log('JournalList: Fetching complete, loading set to false.'); // Add log
    }
  };

  // Fetch entries when the component mounts or the location key changes
  useEffect(() => {
    fetchEntries();
  }, [location.key]); // Add location.key as a dependency

  // Function to filter entries based on search query
  const filterEntries = (query: string, sourceEntries: JournalEntry[]) => {
    if (query.trim() === '') {
      setFilteredEntries(sourceEntries);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const filtered = sourceEntries.filter(entry => 
      entry.childName?.toLowerCase().includes(lowerCaseQuery) || // Added optional chaining
      entry.magicMoments?.toLowerCase().includes(lowerCaseQuery) ||
      entry.behavioralNotes?.toLowerCase().includes(lowerCaseQuery) ||
      entry.medicationNotes?.toLowerCase().includes(lowerCaseQuery) || // Search decrypted notes
      entry.educationNotes?.toLowerCase().includes(lowerCaseQuery) ||
      entry.socialEngagementNotes?.toLowerCase().includes(lowerCaseQuery) ||
      entry.sensoryProfileNotes?.toLowerCase().includes(lowerCaseQuery) ||
      entry.foodNutritionNotes?.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredEntries(filtered);
  };

  // Update filtered entries when search query changes
  useEffect(() => {
    filterEntries(searchQuery, entries);
  }, [searchQuery, entries]); // Depend on both searchQuery and the master entries list

  // Updated handleDelete to accept number
  const handleDelete = async (id: number) => { 
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      try {
        setError(null); // Clear previous errors
        await dbService.deleteJournalEntry(id); // Pass number id
        await fetchEntries(); // Re-fetch entries after deletion
      } catch (err) {
        console.error('Error deleting journal entry:', err);
        setError('Failed to delete journal entry. Please try again.');
      }
    }
  };

  // Updated handleEdit to navigate with number id (if needed, depends on route param type)
  // Assuming route param can handle number or is parsed correctly in JournalForm
  const handleEdit = (id: number) => { 
    navigate(`/journal/edit/${id}`);
  };

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowEntryView(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 mt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-raspberry"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 mt-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-raspberry">Journal Entries</h2>
        <Link 
          to="/journal/new" 
          className="inline-flex items-center px-4 py-2 bg-raspberry text-white rounded-lg hover:bg-raspberry-dark transition-colors duration-200 gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Entry</span>
        </Link>
      </div>

      <div className="mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search journal entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-raspberry focus:border-transparent"
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Check entries length *before* filtering for the "No entries yet" message */}
      {entries.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600 mb-4">No journal entries yet.</p>
          <Link 
            to="/journal/new" 
            className="inline-flex items-center px-4 py-2 bg-raspberry text-white rounded-lg hover:bg-raspberry-dark transition-colors duration-200 gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Entry</span>
          </Link>
        </div>
      ) : filteredEntries.length === 0 ? (
        // This message shows if there are entries, but none match the search
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">No entries match your search "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map(entry => (
            // Ensure entry.id exists before rendering the card
            entry.id !== undefined && ( 
              <div 
                key={entry.id} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{entry.childName || 'Unnamed Entry'}</h3> {/* Handle potentially missing childName */}
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewEntry(entry)}
                      className="text-gray-500 hover:text-raspberry transition-colors"
                      aria-label="View entry"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEdit(entry.id!)} // Use non-null assertion as we checked above
                      className="text-gray-500 hover:text-raspberry transition-colors"
                      aria-label="Edit entry"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(entry.id!)} // Use non-null assertion
                      className="text-gray-500 hover:text-red-600 transition-colors"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">{formatDate(entry.timestamp)}</p>
                
                <div className="space-y-2">
                  {entry.magicMoments && (
                    <div>
                      <h4 className="text-sm font-medium text-raspberry">Magic Moments</h4>
                      <p className="text-gray-700 line-clamp-2">{entry.magicMoments}</p>
                    </div>
                  )}
                  
                  {entry.behavioralNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-raspberry">Behavioral Notes</h4>
                      <p className="text-gray-700 line-clamp-2">{entry.behavioralNotes}</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleViewEntry(entry)}
                  className="mt-4 text-raspberry hover:text-raspberry-dark font-medium text-sm inline-flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Full Entry
                </button>
              </div>
            )
          ))}
        </div>
      )}

      {showEntryView && selectedEntry && (
        <JournalEntryView 
          entry={selectedEntry} 
          onClose={() => setShowEntryView(false)}
          onEdit={() => {
            if (selectedEntry?.id !== undefined) { // Ensure selectedEntry and its id are not null/undefined
              setShowEntryView(false);
              handleEdit(selectedEntry.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default JournalList;
