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
      <div className="space-y-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
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
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Bookings" value={metrics?.total_appointments} icon="📅" color="indigo" />
          <MetricCard title="Cancellation Rate" value={`${metrics?.cancellation_rate}%`} icon="❌" color="rose" />
          <MetricCard title="Total Revenue" value={`Rs. ${metrics?.total_revenue}`} icon="💰" color="emerald" />
          <MetricCard title="Cancelled" value={metrics?.cancelled_appointments} icon="📉" color="amber" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Appointments Trend">
            <Line data={lineData} options={chartOptions} />
          </ChartCard>
          
          <ChartCard title="Staff Performance">
            <Bar data={barData} options={chartOptions} />
          </ChartCard>

          <ChartCard title="Revenue by Service">
            <div className="h-64">
              <Pie data={pieData} options={{...chartOptions, scales: {}}} />
            </div>
          </ChartCard>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-center relative overflow-hidden group shadow-2xl shadow-indigo-900/20">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Performance Summary</h3>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">
                Your business has generated <span className="text-indigo-400 font-black">Rs. {metrics?.total_revenue}</span> from 
                <span className="text-white font-black"> {metrics?.total_appointments - metrics?.cancelled_appointments}</span> successful appointments.
                The cancellation rate is <span className={metrics?.cancellation_rate > 10 ? 'text-rose-400' : 'text-emerald-400 font-black'}>{metrics?.cancellation_rate}%</span>.
              </p>
              <button className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/30">
                Download Report PDF
              </button>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
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
    <div className={`p-8 rounded-[2rem] border ${colors[color]} relative overflow-hidden group transition-all hover:scale-[1.02]`}>
      <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">{title}</p>
      <h4 className="text-3xl font-black text-slate-900">{value}</h4>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md h-[450px] flex flex-col">
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
