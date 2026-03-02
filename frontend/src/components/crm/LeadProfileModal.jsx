import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const LeadProfileModal = ({ lead, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activities, setActivities] = useState([]);

  // Form states
  const [noteContent, setNoteContent] = useState("");
  const [interactionData, setInteractionData] = useState({
    type: "CALL",
    summary: "",
    date: new Date().toISOString().slice(0, 16),
  });
  const [reminderData, setReminderData] = useState({
    title: "",
    description: "",
    remind_at: "",
  });

  const fetchData = useCallback(async () => {
    if (!lead) return;
    try {
      const [n, i, r, a] = await Promise.all([
        api.get(`/api/crm/notes/?lead=${lead.id}`),
        api.get(`/api/crm/interactions/?lead=${lead.id}`),
        api.get(`/api/crm/reminders/?lead=${lead.id}`),
        api.get(`/api/crm/activities/?lead=${lead.id}`),
      ]);
      setNotes(n || []);
      setInteractions(i || []);
      setReminders(r || []);
      setActivities(a || []);
    } catch (err) {
      console.error(err);
    }
  }, [lead]);

  useEffect(() => {
    if (isOpen && lead) {
      fetchData();
    }
  }, [isOpen, lead, fetchData]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      await api.post("/api/crm/notes/", {
        content: noteContent,
        lead: lead.id,
      });
      setNoteContent("");
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to save note: " + (err.message || "Unknown error"));
    }
  };

  const handleLogInteraction = async (e) => {
    e.preventDefault();
    try {
      // Normalize date to ISO string
      const isoDate = new Date(interactionData.date).toISOString();
      await api.post("/api/crm/interactions/", {
        ...interactionData,
        date: isoDate,
        lead: lead.id,
      });
      setInteractionData({
        type: "CALL",
        summary: "",
        date: new Date().toISOString().slice(0, 16),
      });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to log interaction: " + (err.message || "Unknown error"));
    }
  };

  const handleSetReminder = async (e) => {
    e.preventDefault();
    try {
      // Normalize date to ISO string
      const isoDate = new Date(reminderData.remind_at).toISOString();
      await api.post("/api/crm/reminders/", {
        ...reminderData,
        remind_at: isoDate,
        lead: lead.id,
      });
      setReminderData({ title: "", description: "", remind_at: "" });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to set reminder: " + (err.message || "Unknown error"));
    }
  };

  const handleToggleReminder = async (id, currentStatus) => {
    try {
      await api.patch(`/api/crm/reminders/${id}/`, {
        is_completed: !currentStatus,
      });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to update reminder: " + (err.message || "Unknown error"));
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const renderStatus = (s) => {
    const colors = {
      NEW: "bg-blue-100/80 text-blue-700",
      CONTACTED: "bg-amber-100/80 text-amber-700",
      INTERESTED: "bg-indigo-100/80 text-indigo-700",
      CONVERTED: "bg-emerald-100/80 text-emerald-700",
      LOST: "bg-rose-100/80 text-rose-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[s] || colors.NEW}`}
      >
        {s}
      </span>
    );
  };

  if (!isOpen || !lead) return null;

  const timeline = [
    ...activities.map((a) => ({ ...a, type: "System", date: a.created_at })),
    ...notes.map((n) => ({ ...n, type: "Note", date: n.created_at })),
    ...interactions.map((i) => ({ ...i, type: "Interaction", date: i.date })),
    ...reminders.map((r) => ({ ...r, type: "Reminder", date: r.remind_at })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 shrink-0 text-slate-900">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl shadow-sm border border-slate-100">
              {lead.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {lead.name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                {renderStatus(lead.status)}
                <span className="text-xs text-slate-400 font-medium">
                  Lead #{lead.id}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-100"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <nav className="flex gap-8">
            {["overview", "activity", "notes", "interactions", "reminders"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </nav>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-500 pl-4 mb-4">
                  Contact
                </h3>
                <div className="space-y-4 text-slate-900">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Email
                    </p>
                    <p className="font-bold">{lead.email}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-900">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Phone
                    </p>
                    <p className="font-bold">{lead.phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6 text-slate-900">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-4 mb-4">
                  Source & Assignment
                </h3>
                <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                    Assigned To
                  </p>
                  <p className="font-bold">{lead.assigned_to || "No one"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-900">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Source
                  </p>
                  <p className="font-bold">{lead.source || "Unknown"}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6 animate-in fade-in duration-300 text-slate-900">
              <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div
                      className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                        item.type === "System"
                          ? "bg-blue-500"
                          : item.type === "Note"
                            ? "bg-indigo-500"
                            : item.type === "Reminder"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                      }`}
                    ></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all group-hover:bg-white group-hover:shadow-md">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {item.type === "System"
                            ? item.action.replace("_", " ")
                            : item.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium">
                        {item.title ||
                          item.summary ||
                          item.content ||
                          (item.action === "STATUS_CHANGED"
                            ? `Status changed to ${item.new_value}`
                            : item.action)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6 text-slate-900">
              <form
                onSubmit={handleAddNote}
                className="bg-slate-50 p-6 rounded-3xl border border-slate-100"
              >
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none font-medium text-sm mb-4"
                  placeholder="Type a note..."
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
                  >
                    Save Note
                  </button>
                </div>
              </form>
              <div className="space-y-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm"
                  >
                    <p className="text-slate-700 font-medium text-sm">
                      {note.content}
                    </p>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-300 mt-3">
                      {note.user_name} • {formatDate(note.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "interactions" && (
            <div className="space-y-6 text-slate-900">
              <form
                onSubmit={handleLogInteraction}
                className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 gap-4"
              >
                <select
                  value={interactionData.type}
                  onChange={(e) =>
                    setInteractionData({
                      ...interactionData,
                      type: e.target.value,
                    })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                >
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Meeting</option>
                  <option value="NOTE">Other</option>
                </select>
                <input
                  type="datetime-local"
                  value={interactionData.date}
                  onChange={(e) =>
                    setInteractionData({
                      ...interactionData,
                      date: e.target.value,
                    })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                />
                <textarea
                  value={interactionData.summary}
                  onChange={(e) =>
                    setInteractionData({
                      ...interactionData,
                      summary: e.target.value,
                    })
                  }
                  className="col-span-2 h-24 px-4 py-3 rounded-2xl border border-slate-200 font-medium text-sm"
                  placeholder="Summary..."
                  required
                />
                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
                  >
                    Log
                  </button>
                </div>
              </form>
              <div className="space-y-4">
                {interactions.map((i) => (
                  <div
                    key={i.id}
                    className="flex gap-4 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between font-black text-xs uppercase text-slate-800">
                        <span>{i.type}</span>
                        <span>{formatDate(i.date)}</span>
                      </div>
                      <p className="text-slate-600 font-medium text-sm">
                        {i.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="space-y-6 text-slate-900">
              <form
                onSubmit={handleSetReminder}
                className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 gap-4"
              >
                <input
                  type="text"
                  value={reminderData.title}
                  onChange={(e) =>
                    setReminderData({ ...reminderData, title: e.target.value })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                  placeholder="Title"
                  required
                />
                <input
                  type="datetime-local"
                  value={reminderData.remind_at}
                  onChange={(e) =>
                    setReminderData({
                      ...reminderData,
                      remind_at: e.target.value,
                    })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                  required
                />
                <textarea
                  value={reminderData.description}
                  onChange={(e) =>
                    setReminderData({
                      ...reminderData,
                      description: e.target.value,
                    })
                  }
                  className="col-span-2 h-20 px-4 py-3 rounded-2xl border border-slate-200 font-medium text-sm"
                  placeholder="Optional details..."
                />
                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
                  >
                    Set Reminder
                  </button>
                </div>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className={`p-5 rounded-3xl border flex items-start gap-4 ${r.is_completed ? "bg-slate-50 border-slate-100" : "bg-white border-indigo-100 border-l-8 border-l-indigo-500 shadow-sm"}`}
                  >
                    <input
                      type="checkbox"
                      checked={r.is_completed}
                      onChange={() =>
                        handleToggleReminder(r.id, r.is_completed)
                      }
                      className="w-5 h-5"
                    />
                    <div className="flex-1 text-slate-900">
                      <h4
                        className={`font-black text-sm mb-1 ${r.is_completed ? "line-through text-slate-400" : ""}`}
                      >
                        {r.title}
                      </h4>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        {formatDate(r.remind_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-white border border-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadProfileModal;
