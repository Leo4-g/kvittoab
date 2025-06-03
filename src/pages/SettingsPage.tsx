import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const TABS = [
  { key: 'company', label: 'Company Profile' },
  { key: 'users', label: 'Company Users' },
];

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('company');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('uploader');

  useEffect(() => {
    async function fetchCompany() {
      if (!currentUser) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('company')
        .select('id, name, address, phone, info')
        .eq('user_id', currentUser.id)
        .single();
      if (!error && data) {
        setCompany(data);
        setCompanyName(data.name || '');
        setCompanyAddress(data.address || '');
        setCompanyPhone(data.phone || '');
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
    let result;
    if (company) {
      // Update
      result = await supabase
        .from('company')
        .update({
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          info: companyInfo,
        })
        .eq('id', company.id);
    } else {
      // Insert
      result = await supabase
        .from('company')
        .insert({
          user_id: currentUser.id,
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          info: companyInfo,
        });
    }
    if (result.error) {
      setSuccess('Error saving company!');
    } else {
      setSuccess('Settings saved!');
    }
    setLoading(false);
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-4 text-indigo-600">Loading user...</span>
      </div>
    );
  }

  const userRole = currentUser.role; // Assuming role is directly on currentUser

  if (userRole === 'uploader' && !['/scan', '/manual-entry'].includes(location.pathname)) {
    return <Navigate to="/scan" />;
  }
  if (userRole === 'viewer' && !['/', '/reports'].includes(location.pathname)) {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow mt-10">
      <div className="mb-6 flex border-b">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold ${
              activeTab === tab.key
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'company' && (
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
            <label className="block font-medium mb-1">Address</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={companyAddress}
              onChange={e => setCompanyAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Phone</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={companyPhone}
              onChange={e => setCompanyPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Info</label>
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
      )}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Invite User</h2>
          <form
            onSubmit={async e => {
              e.preventDefault();
              setLoading(true);
              // Find user by email
              const { data: users } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', inviteEmail);

              if (!users || users.length === 0) {
                alert('User not found');
                setLoading(false);
                return;
              }
              const userId = users[0].id;
              const { error } = await supabase.from('company_users').insert({
                company_id: company.id,
                user_id: userId,
                role: inviteRole,
              });
              if (error) alert('Error inviting user');
              else alert('User invited!');
              setLoading(false);
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="User email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="uploader">Uploader (scan/manual entry only)</option>
              <option value="viewer">Viewer (home/reports only)</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              disabled={loading}
            >
              Invite
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

