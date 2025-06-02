import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Receipt, Home, LogOut, FileText, Camera, BarChart2, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    async function fetchCompany() {
      if (!currentUser) return;
      const { data } = await supabase
        .from('company')
        .select('name')
        .eq('user_id', currentUser.id)
        .single();
      if (data && data.name) setCompanyName(data.name);
      else setCompanyName('');
    }
    fetchCompany();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (!currentUser) return null;

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Receipt className="h-6 w-6" />
              <span className="font-bold text-xl">Kvitto AB</span>
            </Link>
            {/* Show company name if available */}
            {companyName && (
              <span className="ml-4 text-lg font-semibold text-indigo-100 truncate max-w-xs">
                {companyName}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-indigo-700">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link to="/scan" className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-indigo-700">
              <Camera className="h-5 w-5" />
              <span>Scan</span>
            </Link>
            <Link to="/manual-entry" className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-indigo-700">
              <FileText className="h-5 w-5" />
              <span>Manual Entry</span>
            </Link>
            <Link to="/reports" className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-indigo-700">
              <BarChart2 className="h-5 w-5" />
              <span>Reports</span>
            </Link>
            <Link to="/settings" className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-indigo-700">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-indigo-700"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
