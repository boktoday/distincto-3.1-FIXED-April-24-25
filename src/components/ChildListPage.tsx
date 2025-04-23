import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dbService from '../services/db';
import { Child } from '../types';
import { PlusCircle, Edit, Trash2, User } from 'lucide-react';

const ChildListPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dbService.getAllChildren();
      setChildren(data);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to load children data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this child\'s profile? This action cannot be undone.')) {
      try {
        await dbService.deleteChild(id);
        // Refetch children after deletion
        fetchChildren();
        // TODO: Consider deleting associated journal/food entries or handling orphaned data.
      } catch (err) {
        console.error('Error deleting child:', err);
        setError('Failed to delete child profile.');
      }
    }
  };

  const calculateAge = (dob: string | undefined): string => {
    if (!dob) return 'N/A';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age.toString() : 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20"> {/* Added pt-20 for navbar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Child Profiles</h1>
        <Link
          to="/children/new"
          className="inline-flex items-center px-4 py-2 bg-raspberry hover:bg-raspberry-dark text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Child Profile
        </Link>
      </div>

      {loading && (
         <div className="flex justify-center items-center py-10">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-raspberry"></div>
           <p className="ml-3 text-gray-600">Loading profiles...</p>
         </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!loading && !error && children.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No child profiles found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a child profile.</p>
          <div className="mt-6">
            <Link
              to="/children/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-raspberry hover:bg-raspberry-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Child Profile
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && children.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <div key={child.id} className="bg-white shadow-md rounded-lg overflow-hidden p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{child.name}</h2>
                <p className="text-sm text-gray-600 mb-1"><strong>Age:</strong> {calculateAge(child.dob)}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Identifies As:</strong> {child.identifiesAs || 'Not specified'}</p>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3"><strong>Bio:</strong> {child.biography || 'Not specified'}</p>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => navigate(`/children/edit/${child.id}`)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                  title="Edit Profile"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(child.id!)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                  title="Delete Profile"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildListPage;
