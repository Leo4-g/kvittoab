import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title
);

const categoryOptions = [
  { value: 'all', label: 'All' },
  { value: 'business', label: 'Business Expense' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'other', label: 'Other' },
];

const currencyFormatter = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Helper to get month options from receipts
function getMonthOptions(receipts: any[]) {
  const months = Array.from(
    new Set(
      receipts
        .map(r => r.date && new Date(r.date))
        .filter(Boolean)
        .map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    )
  ).sort((a, b) => b.localeCompare(a));
  return months.map(m => {
    const [year, month] = m.split('-');
    return {
      value: m,
      label: `${year}-${month}`,
    };
  });
}

const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(categoryOptions[0]);
  const [chartData, setChartData] = useState<any>(null);
  const [allReceipts, setAllReceipts] = useState<any[]>([]);
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ value: string; label: string } | null>(null);
  const [customRange, setCustomRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  useEffect(() => {
    async function fetchReceipts() {
      if (!currentUser) return;
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error fetching receipts:', error);
        return;
      }
      setAllReceipts(data);
      setMonthOptions(getMonthOptions(data));
    }
    fetchReceipts();
  }, [currentUser]);

  // Filter receipts by month or custom range
  function getFilteredReceipts() {
    let filtered = allReceipts;
    if (selectedMonth) {
      filtered = filtered.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return monthStr === selectedMonth.value;
      });
    } else if (customRange.start && customRange.end) {
      filtered = filtered.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d >= customRange.start! && d <= customRange.end!;
      });
    }
    return filtered;
  }

  useEffect(() => {
    if (!allReceipts.length) return;
    const receipts = getFilteredReceipts();

    // Aggregate by tax_category
    const categoryMap: Record<string, number> = {};
    receipts.forEach((receipt: any) => {
      const cat = receipt.tax_category || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + (receipt.amount || 0);
    });

    // Build chart data
    const labels = Object.keys(categoryMap).map(cat => {
      const found = categoryOptions.find(opt => opt.value === cat);
      return found ? found.label : cat;
    });
    const values = Object.values(categoryMap);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Expenses',
          data: values,
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#A78BFA', '#F472B6'],
          borderColor: '#6366F1',
          fill: false,
          tension: 0.4,
        },
      ],
      raw: { categoryMap, labels, values }
    });
  // eslint-disable-next-line
  }, [allReceipts, selectedMonth, customRange]);

  if (!chartData) {
    return <div className="p-8">Loading...</div>;
  }

  // Filter logic
  let filteredData = chartData;
  if (selectedCategory.value !== 'all') {
    const idx = chartData.labels.indexOf(
      categoryOptions.find(opt => opt.value === selectedCategory.value)?.label || ''
    );
    filteredData = {
      ...chartData,
      labels: [chartData.labels[idx]],
      datasets: [
        {
          ...chartData.datasets[0],
          data: [chartData.datasets[0].data[idx]],
          backgroundColor: [chartData.datasets[0].backgroundColor[idx]],
        },
      ],
    };
  }

  // --- New: Prepare time series data for Line chart (expenses per month) ---
  function getMonthlyTotals(receipts: any[]) {
    const monthMap: Record<string, number> = {};
    receipts.forEach((r) => {
      if (!r.date) return;
      const d = new Date(r.date);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[monthStr] = (monthMap[monthStr] || 0) + (r.amount || 0);
    });
    // Sort months ascending
    const sortedMonths = Object.keys(monthMap).sort();
    return {
      labels: sortedMonths,
      data: sortedMonths.map((m) => monthMap[m]),
    };
  }

  // --- New: Prepare category breakdown for Pie/Doughnut ---
  function getCategoryTotals(receipts: any[]) {
    const categoryMap: Record<string, number> = {};
    receipts.forEach((receipt: any) => {
      const cat = receipt.tax_category || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + (receipt.amount || 0);
    });
    const labels = Object.keys(categoryMap).map(cat => {
      const found = categoryOptions.find(opt => opt.value === cat);
      return found ? found.label : cat;
    });
    const values = Object.values(categoryMap);
    return { labels, values };
  }

  // --- Prepare data for charts ---
  let filteredReceipts = getFilteredReceipts();
  // Apply category filter to receipts
  if (selectedCategory.value !== 'all') {
    filteredReceipts = filteredReceipts.filter(
      r => (r.tax_category || 'other') === selectedCategory.value
    );
  }
  const monthlyTotals = getMonthlyTotals(filteredReceipts);
  const categoryTotals = getCategoryTotals(filteredReceipts);

  // Pie/Doughnut: Category breakdown
  const pieData = {
    labels: categoryTotals.labels,
    datasets: [
      {
        label: 'Expenses by Category',
        data: categoryTotals.values,
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#A78BFA', '#F472B6'],
      },
    ],
  };

  // Line: Expenses over time (per month)
  const lineData = {
    labels: monthlyTotals.labels,
    datasets: [
      {
        label: 'Total Expenses per Month',
        data: monthlyTotals.data,
        borderColor: '#6366F1',
        backgroundColor: '#A5B4FC',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Bar: Each category is its own dataset for interactive legend, with wider columns
  const barData = {
    labels: categoryTotals.labels,
    datasets: categoryTotals.labels.map((label, i) => ({
      label,
      data: categoryTotals.labels.map((_, j) => (i === j ? categoryTotals.values[j] : 0)),
      backgroundColor: [
        '#36A2EB', // Business Expense
        '#FF6384', // Travel
        '#FFCE56', // Meals & Entertainment
        '#4BC0C0', // Office Supplies
        '#A78BFA', // Other
        '#F472B6', // Extra (if more categories)
      ][i % 6],
      borderWidth: 1,
      barPercentage: 1,
      categoryPercentage: 1,
    })),
  };

  // Use default legend (no custom generateLabels)
  const barChartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => currencyFormatter(context.parsed.y ?? context.raw),
        },
      },
      title: { display: false },
    },
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 1.2,
    scales: {
      y: {
        ticks: {
          callback: (value: number) => currencyFormatter(value),
        },
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
      },
      x: {
        grid: { color: '#e5e7eb' },
        stacked: false,
      },
    },
  };

  // Chart options for Line, Pie, Doughnut
  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => currencyFormatter(context.parsed.y ?? context.raw),
        },
      },
      title: { display: false },
    },
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 1.2,
    scales: {
      y: {
        ticks: {
          callback: (value: number) => currencyFormatter(value),
        },
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
      },
      x: {
        grid: { color: '#e5e7eb' },
      },
    },
  };

  return (
    <div className="p-6 md:p-12 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-10">
        <h1 className="text-3xl font-bold mb-8 text-center text-indigo-700 tracking-tight">Financial Reports</h1>
        <div className="mb-8 flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center">
          <div className="w-full md:w-60">
            <Select
              value={selectedCategory}
              onChange={option => setSelectedCategory(option!)}
              options={categoryOptions}
              placeholder="Filter by category"
              className="text-sm"
            />
          </div>
          <div className="w-full md:w-60">
            <Select
              value={selectedMonth}
              onChange={option => {
                setSelectedMonth(option);
                setCustomRange({ start: null, end: null });
              }}
              options={monthOptions}
              placeholder="Select month"
              isClearable
              className="text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Or custom:</span>
            <DatePicker
              selected={customRange.start}
              onChange={date => setCustomRange(r => ({ ...r, start: date }))}
              selectsStart
              startDate={customRange.start}
              endDate={customRange.end}
              placeholderText="Start date"
              className="border px-2 py-1 rounded text-sm"
              dateFormat="yyyy-MM-dd"
            />
            <DatePicker
              selected={customRange.end}
              onChange={date => setCustomRange(r => ({ ...r, end: date }))}
              selectsEnd
              startDate={customRange.start}
              endDate={customRange.end}
              minDate={customRange.start}
              placeholderText="End date"
              className="border px-2 py-1 rounded text-sm"
              dateFormat="yyyy-MM-dd"
            />
            <button
              className="ml-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              onClick={() => {
                setSelectedMonth(null);
                setCustomRange({ start: null, end: null });
              }}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-100 rounded-lg shadow p-4 flex flex-col items-center" style={{ minHeight: 400 }}>
            <div className="w-full h-72">
              <Line data={lineData} options={chartOptions} />
            </div>
            <div className="text-center mt-4 font-semibold text-indigo-600">Expenses Over Time</div>
          </div>
          <div className="bg-gray-100 rounded-lg shadow p-4 flex flex-col items-center" style={{ minHeight: 400 }}>
            <div className="w-full h-72">
              <Pie data={pieData} options={chartOptions} />
            </div>
            <div className="text-center mt-4 font-semibold text-indigo-600">Category Breakdown</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-lg shadow p-4 flex flex-col items-center" style={{ minHeight: 400 }}>
            <div className="w-full h-72">
              <Bar data={barData} options={barChartOptions} />
            </div>
            <div className="text-center mt-4 font-semibold text-indigo-600">Category Comparison</div>
          </div>
          <div className="bg-gray-100 rounded-lg shadow p-4 flex flex-col items-center" style={{ minHeight: 400 }}>
            <div className="w-full h-72">
              <Doughnut data={pieData} options={chartOptions} />
            </div>
            <div className="text-center mt-4 font-semibold text-indigo-600">Category Share</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;