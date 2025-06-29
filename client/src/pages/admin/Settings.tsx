import React, { useState } from 'react';
import axios from 'axios';

const Settings: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.put(
        '/api/company-admin/settings',
        { companyName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        {error && <p className="mt-2 text-red-500">{error}</p>}
        {success && <p className="mt-2 text-green-500">{success}</p>}
      </div>
    </div>
  );
};

export default Settings;