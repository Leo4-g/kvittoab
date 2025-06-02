import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchCompany() {
      if (!currentUser) return;
      setLoading(true);
      const { data } = await supabase
        .from('company')
        .select('name, info')
        .eq('user_id', currentUser.id)
        .single();
      if (data) {
        setCompanyName(data.name || '');
        setCompanyInfo(data.info || '');
      }
      setLoading(false);
    }
    fetchCompany();
  }, [currentUser]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    await supabase
      .from('company')
      .upsert({
        user_id: currentUser.id,
        name: companyName,
        info: companyInfo,
      });
    setLoading(false);
    setSuccess('Settings saved!');
  }

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow mt-10">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">Company Settings</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Company Name</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Company Info</label>
          <textarea
            className="w-full border px-3 py-2 rounded"
            value={companyInfo}
            onChange={e => setCompanyInfo(e.target.value)}
            rows={4}
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </form>
    </div>
  );
};

export default SettingsPage;