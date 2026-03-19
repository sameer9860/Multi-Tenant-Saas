import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  useAppointmentDashboard,
  useUserProfile,
} from "../../../services/hooks";

// SVG Icons for consistency
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CancelIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-start gap-4">
    <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
      <Icon />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const AppointmentDashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useAppointmentDashboard();
  const { profile } = useUserProfile();

  if (loading) {
    return (
      <DashboardLayout title="Appointment Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Appointment Dashboard">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-rose-700 font-medium">
          {error.message || "Failed to load dashboard data."}
        </div>
      </DashboardLayout>
    );
  }

  const metrics = [
    {
      label: "Today's Appointments",
      value: data?.today_count || 0,
      icon: ClockIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Upcoming (Scheduled)",
      value: data?.upcoming_count || 0,
      icon: CalendarIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Completed",
      value: data?.completed_count || 0,
      icon: CheckIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Cancelled",
      value: data?.cancelled_count || 0,
      icon: CancelIcon,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";
      case "CANCELLED":
        return "bg-rose-100 text-rose-700";
      case "NO_SHOW":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <DashboardLayout
      title="Appointment Dashboard"
      subtitle={`Quick overview for ${profile?.organization?.name || "your business"}`}
    >
      <div className="flex justify-end mb-8">
        <button
          onClick={() => navigate("/dashboard/appointments/book")}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <PlusIcon />
          Book New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {metrics.map((m, i) => (
          <StatCard key={i} {...m} />
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Recent Bookings
            </h3>
            <p className="text-slate-500 font-medium">
              Your latest appointment activity
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/appointments/list")}
            className="text-indigo-600 font-bold flex items-center gap-1 hover:gap-2 transition-all w-fit"
          >
            View All <ArrowRightIcon />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-sans">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Time & Date
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Customer
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Service
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Staff
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.recent_appointments?.length > 0 ? (
                data.recent_appointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {apt.time}
                        </span>
                        <span className="text-xs text-slate-400 font-medium tracking-tight">
                          {new Date(apt.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-700">
                      {apt.customer_name}
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-700">
                      {apt.service_name}
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-700">
                      {apt.staff_name}
                    </td>
                    <td className="px-8 py-5 text-center sm:text-left">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(apt.status)}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-8 py-12 text-center text-slate-400 font-medium italic"
                  >
                    No recent appointments found. Start by booking one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentDashboard;
