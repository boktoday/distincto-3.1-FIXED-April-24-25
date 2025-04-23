import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dbService from '../services/db';
import { Child } from '../types';
import { Save, XCircle } from 'lucide-react';

const ChildForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Partial<Child>>({
    name: '',
    dob: '',
    identifiesAs: '',
    biography: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      dbService.getChild(parseInt(id, 10))
        .then(data => {
          if (data) {
            setChild({
              ...data,
              dob: data.dob ? data.dob.split('T')[0] : '', // Format date for input
            });
          } else {
            setError('Child profile not found.');
          }
        })
        .catch(err => {
          console.error('Error fetching child:', err);
          setError('Failed to load child data.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChild(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!child.name) {
      setError('Child name is required.');
      return;
    }

    setLoading(true);
    try {
      const childDataToSave: Child = {
        ...child,
        name: child.name, // Ensure name is present
        // Ensure dob is in the correct format or undefined if empty
        dob: child.dob || undefined,
      };

      if (isEditing && child.id) {
        await dbService.saveChild(childDataToSave);
      } else {
        // Remove id if it exists from state before saving a new entry
        const { id: _, ...newChildData } = childDataToSave;
        await dbService.saveChild(newChildData as Child);
      }
      navigate('/children'); // Navigate back to the list after save
    } catch (err) {
      console.error('Error saving child:', err);
      setError('Failed to save child profile. Please try again.');
      setLoading(false);
    }
    // No finally setLoading(false) here because we navigate away on success
  };

  if (loading && isEditing) {
     return (
       <div className="flex justify-center items-center py-10 pt-20"> {/* Added pt-20 */}
         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-raspberry"></div>
         <p className="ml-3 text-gray-600">Loading profile...</p>
       </div>
     );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20"> {/* Added pt-20 for navbar */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Edit Child Profile' : 'Add New Child Profile'}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={child.name || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry focus:border-raspberry sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={child.dob || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry focus:border-raspberry sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="identifiesAs" className="block text-sm font-medium text-gray-700">
            Identifies As
          </label>
          <input
            type="text"
            id="identifiesAs"
            name="identifiesAs"
            value={child.identifiesAs || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry focus:border-raspberry sm:text-sm"
            placeholder="e.g., He/Him, She/Her, They/Them, Autistic, etc."
          />
        </div>

        <div>
          <label htmlFor="biography" className="block text-sm font-medium text-gray-700">
            Biography / Key Information
          </label>
          <textarea
            id="biography"
            name="biography"
            rows={5}
            value={child.biography || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry focus:border-raspberry sm:text-sm"
            placeholder="Brief background, strengths, challenges, communication style, key diagnoses, important notes for AI context, etc."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/children')}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            <XCircle className="h-5 w-5 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-raspberry hover:bg-raspberry-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChildForm;
