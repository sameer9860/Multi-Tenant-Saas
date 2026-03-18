import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";

const AppointmentList = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/appointments/appointments/");
      setAppointments(data.results || data);
    } catch (err) {
      setError("Failed to fetch appointments.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await api.delete(`/api/appointments/appointments/${id}/`);
        setAppointments(appointments.filter((a) => a.id !== id));
      } catch (err) {
        alert("Failed to delete appointment.");
      }
    }
  };

  const filteredAppointments = appointments.filter(
    (appt) =>
      appt.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-sky-50 text-sky-600 border-sky-100";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "CANCELLED":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "NO_SHOW":
        return "bg-slate-50 text-slate-600 border-slate-100";
      default:
        return "bg-slate-50 text-slate-400 border-slate-100";
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              Booking List
            </h1>
            <p className="text-slate-500 font-medium">
              Manage your organization's appointment schedule
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/appointments/book")}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-200"
          >
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
                strokeWidth={3}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Book New
          </button>
        </div>

        {/* Filters/Search */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 mb-8">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by customer, service or staff..."
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest">
                    S.N.
                  </th>
                  <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest">
                    Customer
                  </th>
                  <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest">
                    Service
                  </th>
                  <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest">
                    Staff
                  </th>
                  <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest">
                    Date & Time
                  </th>
                  <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                          Loading appointments...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No appointments found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt, index) => (
                    <tr
                      key={appt.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6 font-bold text-slate-400 italic">
                        {index + 1}
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900">
                          {appt.customer_name}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-wider border border-indigo-100">
                          {appt.service_name}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-700">
                          {appt.staff_name}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">
                            {appt.date}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {appt.time.substring(0, 5)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(appt.status)}`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/appointments/view/${appt.id}`,
                              )
                            }
                            title="View Details"
                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                          >
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/appointments/edit/${appt.id}`,
                              )
                            }
                            title="Edit"
                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-amber-500 hover:border-amber-100 rounded-xl transition-all shadow-sm"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(appt.id)}
                            title="Delete"
                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all shadow-sm"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentList;
