import React, { useState, useEffect } from 'react';
import { getEndpoint } from '../../../services/endpoints';
import DashboardLayout from '../../../components/DashboardLayout';
import api from '../../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);


const AppointmentReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const endpoint = getEndpoint('appointments', 'reports');
      let url = endpoint.primary;
      const params = new URLSearchParams();
      if (dateRange.start_date) params.append('start_date', dateRange.start_date);
      if (dateRange.end_date) params.append('end_date', dateRange.end_date);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.get(url);
      console.log('Report Data Response:', response);
      setReportData(response);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData) {
    return (
      <DashboardLayout title="Appointment Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { appointments_per_day, appointments_per_staff, revenue_per_service, metrics } = reportData || {};

  const lineData = {
    labels: appointments_per_day?.map(d => d.day) || [],
    datasets: [
      {
        label: 'Appointments',
        data: appointments_per_day?.map(d => d.count) || [],
        fill: true,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderColor: '#4f46e5',
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: appointments_per_staff?.map(s => s.staff__name) || [],
    datasets: [
      {
        label: 'Appointments',
        data: appointments_per_staff?.map(s => s.count) || [],
        backgroundColor: '#6366f1',
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: revenue_per_service?.map(r => r.service__name) || [],
    datasets: [
      {
        data: revenue_per_service?.map(r => r.total_revenue) || [],
        backgroundColor: [
          '#4f46e5',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { weight: 'bold' }
        }
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } }
    }
  };

  return (
    <DashboardLayout 
      title="Appointment Analysis" 
      subtitle="Gain insights into your booking trends and performance"
    >
      <div className="space-y-8 print:space-y-4">
        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Hide UI chrome */
            .no-print { display: none !important; }
            
            /* Reset body and html for full content printing */
            html, body {
              background: white !important;
              overflow: visible !important;
              height: auto !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Hide sidebar, nav, topbars */
            aside, nav, header, [class*="sidebar"], [class*="Sidebar"] {
              display: none !important;
            }

            /* Make all wrappers show full content */
            #root, #root > *, main, [class*="layout"], [class*="Layout"],
            [class*="content"], [class*="Content"], [class*="dashboard"], [class*="Dashboard"] {
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              position: static !important;
            }

            /* Chart cards: auto height so they don't clip */
            .chart-card-print {
              height: auto !important;
              min-height: 320px !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-shadow: none !important;
              border: 1px solid #e2e8f0 !important;
            }

            /* Metric cards */
            .metric-card-print {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-shadow: none !important;
            }

            /* Remove gaps that cause clipping */
            .grid { gap: 1.5rem !important; }
          }
        `}} />

        {/* Filters and Actions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end no-print">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Start Date</label>
            <input 
              type="date" 
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold transition-all"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">End Date</label>
            <input 
              type="date" 
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold transition-all"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
            />
          </div>
          <button 
            onClick={() => setDateRange({start_date: '', end_date: ''})}
            className="px-6 py-2.5 text-slate-500 hover:text-slate-900 font-bold text-sm transition-all"
          >
            Reset Filters
          </button>
          
          <button 
            onClick={() => window.print()}
            className="ml-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Bookings" value={metrics?.total_appointments || 0} icon="📅" color="indigo" />
          <MetricCard title="Cancellation Rate" value={`${metrics?.cancellation_rate || 0}%`} icon="❌" color="rose" />
          <MetricCard title="Total Revenue" value={`Rs. ${metrics?.total_revenue || 0}`} icon="💰" color="emerald" />
          <MetricCard title="Cancelled" value={metrics?.cancelled_appointments || 0} icon="📉" color="amber" />
        </div>

        {/* Charts — top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Appointments Trend">
            <Line data={lineData} options={chartOptions} />
          </ChartCard>

          <ChartCard title="Staff Performance">
            <Bar data={barData} options={chartOptions} />
          </ChartCard>
        </div>

        {/* Pie chart centered below */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <ChartCard title="Revenue by Service">
              <Pie data={pieData} options={{...chartOptions, scales: {}}} />
            </ChartCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


const MetricCard = ({ title, value, icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className={`metric-card-print p-8 rounded-[2rem] border ${colors[color]} relative overflow-hidden group transition-all hover:scale-[1.02]`}>
      <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">{title}</p>
      <h4 className="text-3xl font-black text-slate-900">{value}</h4>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="chart-card-print bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md h-[450px] print:h-auto flex flex-col">
    <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
      <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
      {title}
    </h3>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

export default AppointmentReports;
