import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchClients();
  }, [token, navigate]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      // In this CRM, Clients are Leads with status='CONVERTED'
      const response = await fetch("/api/crm/leads/?status=CONVERTED", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
      } else if (!response.ok) {
        throw new Error("Failed to fetch clients");
      } else {
        const data = await response.json();
        // Since the backend might not filter by query param yet, filter on frontend too
        setClients(data.filter((l) => l.status === "CONVERTED"));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Client Directory"
      subtitle="All converted customers for this organization"
    >
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-8 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 font-bold animate-pulse">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-slate-400 font-medium italic">
              Loading your customers...
            </div>
          ) : clients.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-slate-300"
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
              <h3 className="text-xl font-black text-slate-700">
                No customers found
              </h3>
              <p className="text-slate-400 font-medium">
                Convert some leads to see them flourish here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                      Name
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                      Contact
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-widest">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900">
                          {client.name}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          #{client.id}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-indigo-600">
                          {client.email}
                        </div>
                        <div className="text-xs text-slate-500">
                          {client.phone}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                          Active Client
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-medium text-slate-500">
                        {new Date().toLocaleDateString()}
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
