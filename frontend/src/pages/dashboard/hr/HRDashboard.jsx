import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
} from "chart.js";
import { Doughnut, Pie, Line, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
);

const HRDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/hr/dashboard/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.clear();
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, navigate]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
              HR Dashboard
            </h1>
            <p className="text-slate-500 font-medium">
              Overview of your HR and Payroll metrics.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-20 text-center text-slate-400 font-medium bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            Loading dashboard metrics…
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Employees */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Total Employees
                </span>
                <span className="text-3xl font-black text-slate-900">
                  {data.total_employees}
                </span>
                <span className="text-sm font-semibold text-emerald-500 mt-2">
                  {data.active_employees} Active
                </span>
              </div>

              {/* Pending Leave Requests */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Pending Leaves
                </span>
                <span className="text-3xl font-black text-amber-500">
                  {data.pending_leave_requests}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-2">
                  Awaiting approval
                </span>
              </div>

              {/* Payroll Processed */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Payroll Processed
                </span>
                <span className="text-3xl font-black text-violet-600">
                  {data.payroll_processed_count}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-2">
                  This month
                </span>
              </div>

              {/* Monthly Expense */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Payroll Expense
                </span>
                <span className="text-3xl font-black text-indigo-600">
                  Rs{" "}
                  {parseFloat(
                    data.monthly_payroll_expense || 0,
                  ).toLocaleString()}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-2">
                  Completed/Paid this month
                </span>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6">
                Today's Attendance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Total Logs
                  </div>
                  <div className="text-2xl font-black text-slate-700">
                    {data.attendance_summary.total_today || 0}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                  <div className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-1">
                    Present
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {data.attendance_summary.present}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                  <div className="text-xs font-bold text-blue-600/70 uppercase tracking-widest mb-1">
                    Half Day
                  </div>
                  <div className="text-2xl font-black text-blue-600">
                    {data.attendance_summary.half_day}
                  </div>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                  <div className="text-xs font-bold text-rose-600/70 uppercase tracking-widest mb-1">
                    Absent
                  </div>
                  <div className="text-2xl font-black text-rose-600">
                    {data.attendance_summary.absent}
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                  <div className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mb-1">
                    On Leave
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    {data.attendance_summary.leave}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Status (Doughnut) */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">
                  Employee Status
                </h3>
                <div className="h-64 flex justify-center">
                  <Doughnut
                    data={{
                      labels: data.employee_status_chart?.labels || [],
                      datasets: [
                        {
                          data: data.employee_status_chart?.data || [],
                          backgroundColor: ["#10b981", "#f43f5e"],
                          borderWidth: 0,
                          hoverOffset: 4,
                        },
                      ],
                    }}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </div>

              {/* Leave Requests (Pie) */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">
                  Leave Requests
                </h3>
                <div className="h-64 flex justify-center">
                  <Pie
                    data={{
                      labels: data.leave_requests_chart?.labels || [],
                      datasets: [
                        {
                          data: data.leave_requests_chart?.data || [],
                          backgroundColor: ["#f59e0b", "#10b981", "#f43f5e"],
                          borderWidth: 0,
                          hoverOffset: 4,
                        },
                      ],
                    }}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </div>

              {/* Attendance Trend (Line) */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">
                  Attendance Trend (7 Days)
                </h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: data.attendance_trend?.labels || [],
                      datasets: [
                        {
                          label: "Present/Half-day",
                          data: data.attendance_trend?.present || [],
                          borderColor: "#10b981",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          tension: 0.4,
                          fill: true,
                        },
                        {
                          label: "Absent",
                          data: data.attendance_trend?.absent || [],
                          borderColor: "#f43f5e",
                          backgroundColor: "rgba(244, 63, 94, 0.1)",
                          tension: 0.4,
                          fill: true,
                        },
                        {
                          label: "On Leave",
                          data: data.attendance_trend?.leave || [],
                          borderColor: "#f59e0b",
                          backgroundColor: "rgba(245, 158, 11, 0.1)",
                          tension: 0.4,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom" } },
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Payroll Expense (Bar) */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">
                  Payroll Expense (6 Months)
                </h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: data.payroll_expense_chart?.labels || [],
                      datasets: [
                        {
                          label: "Total Expense (Rs)",
                          data: data.payroll_expense_chart?.data || [],
                          backgroundColor: "#8b5cf6",
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
