import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dbService from '../services/db';
import encryptionService from '../services/encryption';
import syncService from '../services/sync';
import { JournalEntry } from '../types';
import VoiceRecorder from './VoiceRecorder';

interface JournalFormProps {
  onSave?: () => void;
  onCancel?: () => void;
  existingEntry?: JournalEntry;
}

const JournalForm: React.FC<JournalFormProps> = ({ onSave = () => {}, onCancel = () => {}, existingEntry }) => {
  const [childName, setChildName] = useState('');
  const [medicationNotes, setMedicationNotes] = useState('');
  const [educationNotes, setEducationNotes] = useState('');
  const [socialEngagementNotes, setSocialEngagementNotes] = useState('');
  const [sensoryProfileNotes, setSensoryProfileNotes] = useState('');
  const [foodNutritionNotes, setFoodNutritionNotes] = useState('');
  const [behavioralNotes, setBehavioralNotes] = useState('');
  const [sleepNotes, setSleepNotes] = useState(''); // New state for sleep notes
  const [magicMoments, setMagicMoments] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntry = async () => {
      if (id) {
        try {
          console.log(`JournalForm: Fetching entry with ID: ${id}`);
          await dbService.initialize();
          const journalEntry = await dbService.getJournalEntry(id);

          if (journalEntry) {
            console.log(`JournalForm: Entry found, decrypting...`);
            // Decrypt sensitive data
            const decryptedMedicationNotes = (journalEntry.medicationNotes && typeof journalEntry.medicationNotes === 'string' && journalEntry.medicationNotes.length > 0)
              ? await encryptionService.decrypt(journalEntry.medicationNotes)
              : journalEntry.medicationNotes; // Keep as is if null, undefined, or empty

            console.log(`JournalForm: Decryption complete, setting state.`);
            setEntry({
              ...journalEntry,
              medicationNotes: decryptedMedicationNotes
            });

            setChildName(journalEntry.childName);
            setMedicationNotes(decryptedMedicationNotes || ''); // Ensure string
            setEducationNotes(journalEntry.educationNotes || '');
            setSocialEngagementNotes(journalEntry.socialEngagementNotes || '');
            setSensoryProfileNotes(journalEntry.sensoryProfileNotes || '');
            setFoodNutritionNotes(journalEntry.foodNutritionNotes || '');
            setBehavioralNotes(journalEntry.behavioralNotes || '');
            setSleepNotes(journalEntry.sleepNotes || ''); // Load sleep notes
            setMagicMoments(journalEntry.magicMoments || '');
          } else {
            console.warn(`JournalForm: Journal entry with ID ${id} not found`);
            setError('Journal entry not found');
            navigate('/journal');
          }
        } catch (err) {
          console.error('JournalForm: Error fetching journal entry:', err);
          setError('Failed to load journal entry. Please try again.');
        }
      } else if (existingEntry) {
        console.log(`JournalForm: Using existing entry prop.`);
        setEntry(existingEntry);
        setChildName(existingEntry.childName);
        setMedicationNotes(existingEntry.medicationNotes || ''); // Assuming existingEntry medication notes are already decrypted if needed
        setEducationNotes(existingEntry.educationNotes || '');
        setSocialEngagementNotes(existingEntry.socialEngagementNotes || '');
        setSensoryProfileNotes(existingEntry.sensoryProfileNotes || '');
        setFoodNutritionNotes(existingEntry.foodNutritionNotes || '');
        setBehavioralNotes(existingEntry.behavioralNotes || '');
        setSleepNotes(existingEntry.sleepNotes || ''); // Load sleep notes
        setMagicMoments(existingEntry.magicMoments || '');
      } else {
         console.log(`JournalForm: No ID and no existing entry prop. Ready for new entry.`);
      }
    };

    fetchEntry();
  }, [id, existingEntry, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('JournalForm: handleSubmit triggered.'); // Log: Start

    if (!childName.trim()) {
      setError('Child name is required');
      console.warn('JournalForm: Child name is empty.'); // Log: Validation fail
      return;
    }

    setIsSaving(true);
    setError('');
    console.log('JournalForm: Starting save process...'); // Log: Saving state set

    try {
      console.log('JournalForm: Initializing DB...'); // Log: Before DB init
      await dbService.initialize();
      console.log('JournalForm: DB Initialized.'); // Log: After DB init

      // Encrypt sensitive data
      console.log('JournalForm: Encrypting medication notes...'); // Log: Before encrypt
      const encryptedMedicationNotes = medicationNotes.trim()
        ? await encryptionService.encrypt(medicationNotes.trim())
        : ''; // Encrypt only if not empty
      console.log('JournalForm: Encryption complete.'); // Log: After encrypt

      const journalEntry: JournalEntry = {
        id: entry?.id || crypto.randomUUID(),
        childName: childName.trim(),
        timestamp: entry?.timestamp || Date.now(),
        medicationNotes: encryptedMedicationNotes,
        educationNotes: educationNotes.trim(),
        socialEngagementNotes: socialEngagementNotes.trim(),
        sensoryProfileNotes: sensoryProfileNotes.trim(),
        foodNutritionNotes: foodNutritionNotes.trim(),
        behavioralNotes: behavioralNotes.trim(),
        sleepNotes: sleepNotes.trim(), // Save sleep notes
        magicMoments: magicMoments.trim(),
        synced: false // Mark as not synced initially
      };
      console.log('JournalForm: Journal entry object created:', journalEntry.id); // Log: Entry object ID

      console.log('JournalForm: Saving entry to DB...'); // Log: Before DB save
      await dbService.saveJournalEntry(journalEntry);
      console.log('JournalForm: Entry saved to DB successfully.'); // Log: After DB save

      // Attempt to register for background sync, but don't let it block navigation
      let syncRegistered = false;
      try {
        console.log('JournalForm: Attempting to register for background sync...'); // Log: Before sync register attempt
        syncRegistered = await syncService.registerForSync();
        if (syncRegistered) {
          console.log('JournalForm: Background sync registration successful (or already registered).'); // Log: After sync register success
        } else {
          console.warn('JournalForm: Background sync registration returned false (failed or unsupported).'); // Log: Sync registration failed/unsupported
        }
      } catch (syncErr) {
        // This catch block handles errors thrown *synchronously* by registerForSync
        // or if the promise returned by it rejects.
        console.error('JournalForm: Error caught during background sync registration attempt:', syncErr); // Log: Sync registration error
        // We explicitly log the error here but allow execution to continue.
      }

      console.log('JournalForm: Execution continuing after sync registration attempt.'); // Log: After inner try/catch

      console.log('JournalForm: Calling onSave callback...'); // Log: Before onSave
      onSave(); // Call onSave to update the parent component (if needed)
      console.log('JournalForm: onSave callback finished.'); // Log: After onSave

      // IMPORTANT: Reset saving state *before* navigating
      console.log('JournalForm: Resetting isSaving state to false.');
      setIsSaving(false);

      console.log('JournalForm: Preparing to navigate to /journal...'); // Log: Before navigate
      navigate('/journal');
      console.log('JournalForm: Navigation to /journal requested.'); // Log: After navigate call

    } catch (err) {
      console.error('JournalForm: Error during save process (outer catch):', err); // Log: Error caught in outer block
      setError(`Failed to save journal entry: ${err instanceof Error ? err.message : String(err)}`);
      setIsSaving(false); // Ensure isSaving is reset on outer error
    }
  };

  // Handle transcription completion for each field
  const handleTranscription = (field: string, text: string) => {
    switch (field) {
      case 'medication':
        setMedicationNotes(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      case 'education':
        setEducationNotes(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      case 'social':
        setSocialEngagementNotes(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      case 'sensory':
        setSensoryProfileNotes(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      case 'food':
        setFoodNutritionNotes(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      case 'behavioral':
        setBehavioralNotes(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      case 'sleep': // Handle sleep transcription
        setSleepNotes(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      case 'magic':
        setMagicMoments(prev => prev ? `${prev}\n\n${text}` : text);
        break;
      default:
        console.warn(`JournalForm: Unknown transcription field: ${field}`);
    }
  };

  const handleCancel = () => {
    console.log('JournalForm: Cancel button clicked, navigating to /journal.');
    navigate('/journal');
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold text-raspberry mb-6 text-center">
        {id ? 'Edit Journal Entry' : 'New Journal Entry'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
          Child Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="childName"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          required
        />
      </div>

      {/* Medication Notes */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="medicationNotes" className="block text-sm font-medium text-gray-700">
            Medication Notes
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('medication', text)}
            fieldName="medication"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="medicationNotes"
          value={medicationNotes}
          onChange={(e) => setMedicationNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Observations, concerns, dosages, times"
        />
      </div>

      {/* Education Notes */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="educationNotes" className="block text-sm font-medium text-gray-700">
            Education Notes
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('education', text)}
            fieldName="education"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="educationNotes"
          value={educationNotes}
          onChange={(e) => setEducationNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Activities, progress, learning milestones"
        />
      </div>

      {/* Social Engagement Notes */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="socialEngagementNotes" className="block text-sm font-medium text-gray-700">
            Social Engagement Notes
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('social', text)}
            fieldName="social"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="socialEngagementNotes"
          value={socialEngagementNotes}
          onChange={(e) => setSocialEngagementNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Interactions, communication patterns, relationship development"
        />
      </div>

      {/* Sensory Profile Notes */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="sensoryProfileNotes" className="block text-sm font-medium text-gray-700">
            Sensory Profile Notes
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('sensory', text)}
            fieldName="sensory"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="sensoryProfileNotes"
          value={sensoryProfileNotes}
          onChange={(e) => setSensoryProfileNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Preferences, triggers, successful accommodations"
        />
      </div>

      {/* Food & Nutrition Notes */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="foodNutritionNotes" className="block text-sm font-medium text-gray-700">
            Food & Nutrition Notes
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('food', text)}
            fieldName="food"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="foodNutritionNotes"
          value={foodNutritionNotes}
          onChange={(e) => setFoodNutritionNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Intake, preferences, allergies, reactions"
        />
      </div>

      {/* Behavioral Notes */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="behavioralNotes" className="block text-sm font-medium text-gray-700">
            Behavioral Notes
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('behavioral', text)}
            fieldName="behavioral"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="behavioralNotes"
          value={behavioralNotes}
          onChange={(e) => setBehavioralNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Observations, interventions, responses, triggers"
        />
      </div>

      {/* Sleep Notes - New Field */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="sleepNotes" className="block text-sm font-medium text-gray-700">
            Sleep Notes
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('sleep', text)}
            fieldName="sleep"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="sleepNotes"
          value={sleepNotes}
          onChange={(e) => setSleepNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Duration, quality, routines, disturbances"
        />
      </div>

{/* Magic Moments */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="magicMoments" className="block text-sm font-medium text-gray-700">
            Magic Moments
          </label>
          <VoiceRecorder
            onTranscriptionComplete={(text) => handleTranscription('magic', text)}
            fieldName="magic"
            disabled={isSaving}
          />
        </div>
        <textarea
          id="magicMoments"
          value={magicMoments}
          onChange={(e) => setMagicMoments(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Positive experiences, breakthroughs, celebrations"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary mr-3"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || !childName.trim()} // Also disable if child name is empty
          className="btn-primary"
        >
          {isSaving ? 'Saving...' : id ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
};

export default JournalForm;
