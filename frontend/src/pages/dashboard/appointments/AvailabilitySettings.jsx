import React, { useState, useEffect } from "react";
import DashboardLayout from "../../../components/DashboardLayout";

const AvailabilitySettings = () => {
  const token = localStorage.getItem("token");
  const [staff, setStaff] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    staff: "",
    day_of_week: "0",
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 30,
  });

  const DAYS = [
    { value: 0, label: "Monday" },
    { value: 1, label: "Tuesday" },
    { value: 2, label: "Wednesday" },
    { value: 3, label: "Thursday" },
    { value: 4, label: "Friday" },
    { value: 5, label: "Saturday" },
    { value: 6, label: "Sunday" },
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaffId) {
      fetchAvailabilities(selectedStaffId);
      setForm((prev) => ({ ...prev, staff: selectedStaffId }));
    } else {
      setAvailabilities([]);
    }
  }, [selectedStaffId]);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/appointments/staff/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      setStaff(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async (staffId) => {
    try {
      const res = await fetch(`/api/appointments/staff-availability/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch availabilities");
      const data = await res.json();
      const allData = data.results || data;
      // Filter manually if API doesn't support query params yet,
      // although we should ideally handle this in the viewset filter_backends
      setAvailabilities(allData.filter((a) => a.staff === parseInt(staffId)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/appointments/staff-availability/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok)
        throw new Error("Failed to add availability. It might already exist.");
      fetchAvailabilities(selectedStaffId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this availability slot?")
    )
      return;
    try {
      const res = await fetch(`/api/appointments/staff-availability/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete availability");
      fetchAvailabilities(selectedStaffId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Staff Availability
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Set working hours and appointment slot durations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Staff Selection & Add Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Select Staff Member
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-zinc-900"
              >
                <option value="">-- Choose Staff --</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            {selectedStaffId && (
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Add Availability
                </h3>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      Day of Week
                    </label>
                    <select
                      value={form.day_of_week}
                      onChange={(e) =>
                        setForm({ ...form, day_of_week: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900"
                    >
                      {DAYS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) =>
                          setForm({ ...form, start_time: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={form.end_time}
                        onChange={(e) =>
                          setForm({ ...form, end_time: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      Slot Duration (min)
                    </label>
                    <input
                      type="number"
                      value={form.slot_duration_minutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          slot_duration_minutes: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-200"
                  >
                    Add Schedule
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: List of Availabilities */}
          <div className="lg:col-span-2">
            {!selectedStaffId ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-300"
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
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No Staff Selected
                </h3>
                <p className="text-slate-500">
                  Choose a staff member to view and manage their schedule
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900">
                    Current Schedule
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {availabilities.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium">
                      No availability slots defined for this staff member.
                    </div>
                  ) : (
                    availabilities
                      .sort((a, b) => a.day_of_week - b.day_of_week)
                      .map((avail) => (
                        <div
                          key={avail.id}
                          className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors group"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-24">
                              <span className="text-sm font-black text-indigo-600 uppercase tracking-wider">
                                {
                                  DAYS.find(
                                    (d) => d.value === avail.day_of_week,
                                  )?.label
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-900 font-bold">
                                {avail.start_time.substring(0, 5)}
                              </span>
                              <span className="text-slate-300">—</span>
                              <span className="text-slate-900 font-bold">
                                {avail.end_time.substring(0, 5)}
                              </span>
                            </div>
                            <div className="hidden sm:block px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">
                              {avail.slot_duration_minutes} min slots
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(avail.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <svg
                              className="w-5 h-5"
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
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AvailabilitySettings;
