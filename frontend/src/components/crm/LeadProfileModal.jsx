import React, { useState, useEffect } from "react";
import api from "../../services/api";

const LeadProfileModal = ({ lead, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New states for expanded features
  const [notes, setNotes] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activities, setActivities] = useState([]);

  // Form states
  const [newNote, setNewNote] = useState({ content: "" });
  const [newInteraction, setNewInteraction] = useState({
    type: "CALL",
    summary: "",
    date: new Date().toISOString().slice(0, 16),
  });
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    remind_at: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (lead) {
      setEditedLead({ ...lead });
      setError(null);
      fetchRelatedData();
    }
  }, [lead]);

  const fetchRelatedData = async () => {
    if (!lead) return;
    try {
      const [notesData, interactionsData, remindersData, activitiesData] =
        await Promise.all([
          api.get(`/api/crm/notes/?lead=${lead.id}`),
          api.get(`/api/crm/interactions/?lead=${lead.id}`),
          api.get(`/api/crm/reminders/?lead=${lead.id}`),
          api.get(`/api/crm/activities/?lead=${lead.id}`),
        ]);
      setNotes(notesData);
      setInteractions(interactionsData);
      setReminders(remindersData);
      setActivities(activitiesData);
    } catch (err) {
      console.error("Failed to fetch related data:", err);
    }
  };

  if (!isOpen || !lead) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.put(`/api/crm/leads/${lead.id}/`, editedLead);
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message || "Failed to update lead.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/crm/notes/", { ...newNote, lead: lead.id });
      setNewNote({ content: "" });
      fetchRelatedData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateInteraction = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/crm/interactions/", {
        ...newInteraction,
        lead: lead.id,
      });
      setNewInteraction({
        type: "CALL",
        summary: "",
        date: new Date().toISOString().slice(0, 16),
      });
      fetchRelatedData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/crm/reminders/", { ...newReminder, lead: lead.id });
      setNewReminder({
        title: "",
        description: "",
        remind_at: new Date().toISOString().slice(0, 16),
      });
      fetchRelatedData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLead((prev) => ({ ...prev, [name]: value }));
  };

  const statusColors = {
    NEW: "bg-blue-100/80 text-blue-700 border-blue-200",
    CONTACTED: "bg-amber-100/80 text-amber-700 border-amber-200",
    INTERESTED: "bg-indigo-100/80 text-indigo-700 border-indigo-200",
    CONVERTED: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
    LOST: "bg-rose-100/80 text-rose-700 border-rose-200",
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimelineData = () => {
    const combined = [
      ...notes.map((n) => ({ ...n, timelineType: "NOTE", date: n.created_at })),
      ...interactions.map((i) => ({ ...i, timelineType: "INTERACTION" })),
      ...activities.map((a) => ({
        ...a,
        timelineType: "ACTIVITY",
        date: a.created_at,
      })),
    ];
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20">
        {/* Header */}
        <div className="p-8 pb-0 flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
              {lead.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {lead.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[lead.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                >
                  {lead.status}
                </span>
              </div>
              <p className="text-slate-500 font-medium flex items-center gap-2">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {lead.email || "No email provided"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all border border-slate-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 mt-8 border-b border-slate-100 flex gap-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "timeline", label: "Timeline" },
            { id: "notes", label: "Notes" },
            { id: "interactions", label: "Interactions" },
            { id: "reminders", label: "Follow-up Reminders" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    Details
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          name="name"
                          value={editedLead.name}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        />
                      ) : (
                        <p className="text-sm font-bold text-slate-700 px-1">
                          {lead.name}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            name="email"
                            type="email"
                            value={editedLead.email || ""}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          />
                        ) : (
                          <p className="text-sm font-bold text-slate-700 px-1">
                            {lead.email || "N/A"}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">
                          Phone
                        </label>
                        {isEditing ? (
                          <input
                            name="phone"
                            value={editedLead.phone || ""}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          />
                        ) : (
                          <p className="text-sm font-bold text-slate-700 px-1">
                            {lead.phone || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">
                        Status
                      </label>
                      {isEditing ? (
                        <select
                          name="status"
                          value={editedLead.status}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none"
                        >
                          <option value="NEW">New</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="INTERESTED">Interested</option>
                          <option value="CONVERTED">Converted</option>
                          <option value="LOST">Lost</option>
                        </select>
                      ) : (
                        <p className="text-sm font-bold text-slate-700 px-1">
                          {lead.status}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  )}
                </form>
              </div>

              <div className="space-y-8 col-span-2 lg:col-span-1">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                    Attribution
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Source
                      </span>
                      <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-slate-50 rounded-lg">
                        {lead.source || "Direct"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Created At
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative pl-8 space-y-8 pt-4">
                {/* Vertical Line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 rounded-full"></div>

                {getTimelineData().length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                    <p className="text-slate-400 font-bold italic">
                      No activity recorded yet.
                    </p>
                  </div>
                ) : (
                  getTimelineData().map((item, idx) => (
                    <div
                      key={`${item.timelineType}-${item.id}`}
                      className="relative group"
                    >
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-8 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                          item.timelineType === "ACTIVITY"
                            ? "bg-emerald-500"
                            : item.timelineType === "INTERACTION"
                              ? "bg-indigo-500"
                              : "bg-amber-500"
                        }`}
                      ></div>

                      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                item.timelineType === "ACTIVITY"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : item.timelineType === "INTERACTION"
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {item.timelineType}
                            </span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              {formatDate(item.date)}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            By {item.user_name || item.user || "System"}
                          </span>
                        </div>

                        {item.timelineType === "ACTIVITY" && (
                          <div className="text-sm font-bold text-slate-700">
                            {item.action === "CREATED" ? (
                              <span>Lead was created</span>
                            ) : item.action === "STATUS_CHANGED" ? (
                              <span className="flex items-center gap-2">
                                Status changed from
                                <span className="px-1.5 py-0.5 bg-slate-50 border rounded text-[10px] uppercase font-medium">
                                  {item.old_value}
                                </span>
                                <svg
                                  className="w-3 h-3 text-slate-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                  />
                                </svg>
                                <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded text-[10px] uppercase font-black">
                                  {item.new_value}
                                </span>
                              </span>
                            ) : item.action === "CONVERTED_TO_CUSTOMER" ? (
                              <span className="text-emerald-600">
                                Lead converted to Customer
                              </span>
                            ) : (
                              <span>{item.action.replace(/_/g, " ")}</span>
                            )}
                          </div>
                        )}

                        {item.timelineType === "INTERACTION" && (
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">
                              {item.type}
                            </p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                              {item.summary}
                            </p>
                          </div>
                        )}

                        {item.timelineType === "NOTE" && (
                          <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form
                onSubmit={handleCreateNote}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4"
              >
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ content: e.target.value })}
                  placeholder="Add a private note about this lead..."
                  className="flex-1 bg-slate-50 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none min-h-[100px]"
                  required
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all self-end h-12 shadow-lg shadow-indigo-100"
                >
                  Add Note
                </button>
              </form>

              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                    <p className="text-slate-400 font-bold italic">
                      No notes added yet.
                    </p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all"
                    >
                      <p className="text-slate-700 font-medium mb-4 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          By {note.user_name || "System"}
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "interactions" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                  Log New Interaction
                </h3>
                <form
                  onSubmit={handleCreateInteraction}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Interaction Type
                    </label>
                    <select
                      value={newInteraction.type}
                      onChange={(e) =>
                        setNewInteraction({
                          ...newInteraction,
                          type: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="CALL">Call</option>
                      <option value="EMAIL">Email</option>
                      <option value="MEETING">Meeting</option>
                      <option value="NOTE">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newInteraction.date}
                      onChange={(e) =>
                        setNewInteraction({
                          ...newInteraction,
                          date: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Summary
                    </label>
                    <textarea
                      value={newInteraction.summary}
                      onChange={(e) =>
                        setNewInteraction({
                          ...newInteraction,
                          summary: e.target.value,
                        })
                      }
                      placeholder="What was discussed?"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none h-24"
                      required
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      type="submit"
                      className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Log Interaction
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex items-start gap-4"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        interaction.type === "CALL"
                          ? "bg-blue-50 text-blue-600"
                          : interaction.type === "EMAIL"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {interaction.type === "CALL" ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {interaction.type} Interaction
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatDate(interaction.date)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {interaction.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                  Schedule Follow-up
                </h3>
                <form
                  onSubmit={handleCreateReminder}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Title
                    </label>
                    <input
                      value={newReminder.title}
                      onChange={(e) =>
                        setNewReminder({
                          ...newReminder,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g., Call to discuss pricing"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Remind At
                    </label>
                    <input
                      type="datetime-local"
                      value={newReminder.remind_at}
                      onChange={(e) =>
                        setNewReminder({
                          ...newReminder,
                          remind_at: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Description
                    </label>
                    <textarea
                      value={newReminder.description}
                      onChange={(e) =>
                        setNewReminder({
                          ...newReminder,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none h-20"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Set Reminder
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`bg-white p-6 rounded-[2rem] border ${reminder.is_completed ? "border-slate-100 bg-slate-50/50 opacity-60" : "border-slate-200 shadow-sm"}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4
                        className={`text-sm font-black tracking-tight ${reminder.is_completed ? "line-through text-slate-400" : "text-slate-900"}`}
                      >
                        {reminder.title}
                      </h4>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${reminder.is_completed ? "bg-slate-200 text-slate-500" : "bg-indigo-50 text-indigo-600"}`}
                      >
                        {reminder.is_completed ? "Done" : "Pending"}
                      </span>
                    </div>
                    {reminder.description && (
                      <p className="text-xs text-slate-500 font-medium mb-4">
                        {reminder.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <svg
                        className="w-3.5 h-3.5"
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
                      {formatDate(reminder.remind_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadProfileModal;
