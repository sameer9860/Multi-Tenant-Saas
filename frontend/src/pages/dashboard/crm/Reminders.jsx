import React, { useState, useEffect } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";
import LeadProfileModal from "../../../components/crm/LeadProfileModal";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/crm/reminders/");
      setReminders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (id, currentStatus) => {
    try {
      await api.patch(`/api/crm/reminders/${id}/`, {
        is_completed: !currentStatus,
      });
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewLead = async (leadId) => {
    try {
      const lead = await api.get(`/api/crm/leads/${leadId}/`);
      setSelectedLead(lead);
      setProfileModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            Follow-up Dashboard
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Manage all your upcoming lead interactions and reminders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
              Loading reminders...
            </div>
          ) : reminders.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100 italic text-slate-400">
              No reminders found.
            </div>
          ) : (
            reminders.map((r) => (
              <div
                key={r.id}
                className={`p-6 rounded-[2rem] border transition-all ${r.is_completed ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.is_completed ? "bg-slate-200 text-slate-500" : new Date(r.remind_at) < new Date() ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"}`}
                  >
                    {r.is_completed
                      ? "Completed"
                      : new Date(r.remind_at) < new Date()
                        ? "Overdue"
                        : "Upcoming"}
                  </div>
                  <input
                    type="checkbox"
                    checked={r.is_completed}
                    onChange={() => handleToggleReminder(r.id, r.is_completed)}
                    className="w-6 h-6 border-2 border-slate-200 rounded-lg text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <h3
                  className={`text-lg font-black text-slate-900 mb-1 ${r.is_completed ? "line-through text-slate-400" : ""}`}
                >
                  {r.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">
                  {r.description || "No description provided."}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDate(r.remind_at)}
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Lead: {r.lead_name || "Unknown"}
                  </span>
                  <button
                    onClick={() => handleViewLead(r.lead)}
                    className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-800 transition-colors"
                  >
                    View Profile &rarr;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <LeadProfileModal
        lead={selectedLead}
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onUpdate={fetchReminders}
      />
    </DashboardLayout>
  );
};

export default Reminders;
