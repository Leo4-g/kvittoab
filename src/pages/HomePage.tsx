// src/pages/HomePage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext'; // Justera import‐sökvägen efter din struktur

type Receipt = {
  id: number;
  vendor: string;
  amount: number;
  category: string;
  date: string;   // ISO‐string, t.ex. "2025-06-02T00:00:00+00:00"
  user_id: string; // Se till att din tabell faktiskt har denna kolumn
};

export default function HomePage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState<number>(0);
  const navigate = useNavigate();
  const { user } = useAuth(); // Anta att du har en Auth‐hook som ger dig user.id

  useEffect(() => {
    async function fetchReceipts() {
      if (!user) return;

      // 1) Filtrera på inloggad användare (user_id = user.id)
      // 2) Sortera på date i fallande ordning (nyast först)
      const { data, error } = await supabase
        .from<Receipt>('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Fel vid inläsning av kvitton:', error);
        return;
      }

      if (data) {
        setReceipts(data);

        // Beräkna totalen över de hämtade kvittona
        const sum = data.reduce((acc, r) => acc + r.amount, 0);
        setTotal(sum);
      }
    }

    fetchReceipts();
  }, [user]);

  return (
    <div className="p-6 space-y-6">
      {/* ====================== HEADER + KNAPPAR ====================== */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="space-x-2">
          <button
            onClick={() => navigate('/scan')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Scan Receipt
          </button>
          <button
            onClick={() => navigate('/manual-entry')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Manual Entry
          </button>
        </div>
      </div>

      {/* ====================== DASHBOARD‐KORT ====================== */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Expenses */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-gray-600 text-sm font-medium">Total Expenses</h3>
          <p className="text-2xl font-semibold mt-1">
            ${total.toFixed(2)}
          </p>
        </div>

        {/* Receipts Count */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-gray-600 text-sm font-medium">Receipts Count</h3>
          <p className="text-2xl font-semibold mt-1">
            {receipts.length}
          </p>
        </div>

        {/* Latest Receipt */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-gray-600 text-sm font-medium">
            Latest Receipt
          </h3>
          {receipts[0] ? (
            <p className="text-2xl font-semibold mt-1">
              ${receipts[0].amount.toFixed(2)}
            </p>
          ) : (
            <p className="text-2xl font-semibold mt-1">—</p>
          )}
        </div>
      </div>

      {/* ====================== RECENT RECEIPTS‐TABELL ====================== */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DATE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                VENDOR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AMOUNT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CATEGORY
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {receipts.map((r) => (
              <tr key={r.id}>
                {/* 2) Visa bara YYYY-MM-DD (ta bort "T00:00:00+00:00") */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {r.date.slice(0, 10)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {r.vendor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${r.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {r.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
