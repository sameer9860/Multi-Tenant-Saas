import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const fetchClients = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/crm/leads/?status=CONVERTED");
      setClients(data.filter((l) => l.status === "CONVERTED"));
    } catch (err) {
      if (err.code === 401) {
        localStorage.clear();
        navigate("/login");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchClients();
  }, [token, navigate, fetchClients]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
              Client Directory
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Authorized customer records for your active organization.
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping"></div>
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
              Live Multi-Tenant Data
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl font-bold flex items-center gap-3">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-500">
          {loading ? (
            <div className="p-32 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <div className="text-slate-400 font-black uppercase tracking-widest text-sm">
                Syncing Secure Data...
              </div>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-32 text-center bg-gradient-to-b from-white to-slate-50/50">
              <div className="w-24 h-24 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                Private Client Data Reserved
              </h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto">
                Convert leads within this organization to populate your
                exclusive directory.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Customer Entity
                    </th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Communication
                    </th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Compliance Status
                    </th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Retention Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-indigo-50/20 transition-all duration-300 group"
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100/50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-110 transition-transform">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-lg">
                              {client.name}
                            </div>
                            <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-0.5">
                              ID: {String(client.id).slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="text-sm font-bold text-slate-700 bg-slate-50 inline-block px-3 py-1 rounded-lg mb-1">
                          {client.email}
                        </div>
                        <div className="text-xs text-slate-400 font-medium pl-3 border-l-2 border-slate-100 ml-1">
                          {client.phone}
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-2xl border border-emerald-100">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            Converted Asset
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <div className="text-sm font-black text-slate-900">
                          {new Date(
                            client.created_at || Date.now(),
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                          Verified Member
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Clients;
