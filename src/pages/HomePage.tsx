import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { Receipt } from '../types';
import { PlusCircle, Receipt as ReceiptIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { currentUser } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [sortOption, setSortOption] = useState('newest');

  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Get unique categories and vendors for filter dropdowns
  const categories = Array.from(new Set(receipts.map(r => r.tax_category).filter(Boolean)));
  const vendors = Array.from(new Set(receipts.map(r => r.vendor).filter(Boolean)));

  useEffect(() => {
    async function fetchReceipts() {
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('date', { ascending: false });

        if (error) throw error;

        const receiptsData = data || [];
        let total = 0;

        receiptsData.forEach((receipt) => {
          total += receipt.amount;
        });

        setReceipts(receiptsData);
        setTotalAmount(total);
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReceipts();
  }, [currentUser]);

  // Filtering logic
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesCategory = filterCategory ? receipt.tax_category === filterCategory : true;
    const matchesVendor = filterVendor ? receipt.vendor === filterVendor : true;
    const matchesStartDate = filterStartDate ? new Date(receipt.date) >= new Date(filterStartDate) : true;
    const matchesEndDate = filterEndDate ? new Date(receipt.date) <= new Date(filterEndDate) : true;
    return matchesCategory && matchesVendor && matchesStartDate && matchesEndDate;
  });

  // Sorting logic
  const sortedReceipts = [...filteredReceipts].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'highest':
        return b.amount - a.amount;
      case 'lowest':
        return a.amount - b.amount;
      case 'alphabetical':
        return a.vendor.localeCompare(b.vendor);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-4">
          <Link
            to="/scan"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Scan Receipt
          </Link>
          <Link
            to="/manual-entry"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Manual Entry
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Expenses</h2>
          <p className="text-3xl font-bold text-indigo-600">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Receipts Count</h2>
          <p className="text-3xl font-bold text-indigo-600">{receipts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Latest Receipt</h2>
          <p className="text-3xl font-bold text-indigo-600">
            {receipts.length > 0
              ? `$${receipts[0].amount.toFixed(2)}`
              : 'No receipts yet'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center px-6 py-4 bg-gray-50 border-b border-gray-200 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Receipts</h2>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {/* Vendor Filter */}
            <select
              value={filterVendor}
              onChange={e => setFilterVendor(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
            {/* Date Range Filter */}
            <input
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              placeholder="Start date"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              placeholder="End date"
            />
            {/* Sort Dropdown */}
            <label className="ml-2 mr-2 text-sm text-gray-700" htmlFor="sort">Sort by:</label>
            <select
              id="sort"
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
              <option value="alphabetical">Alphabetical (Vendor)</option>
            </select>
          </div>
        </div>

        {sortedReceipts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <ReceiptIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No receipts found. Start by scanning or manually adding a receipt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(receipt.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receipt.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${receipt.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receipt.tax_category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
