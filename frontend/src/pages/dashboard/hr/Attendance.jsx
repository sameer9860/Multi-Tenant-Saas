import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", color: "bg-emerald-500" },
  { value: "ABSENT", label: "Absent", color: "bg-rose-500" },
  { value: "LEAVE", label: "Leave", color: "bg-amber-500" },
  { value: "HALF_DAY", label: "Half Day", color: "bg-indigo-500" },
];

const Attendance = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // State
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // employeeId -> status
  const [notes, setNotes] = useState({}); // employeeId -> note
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState("DAILY"); // DAILY or MONTHLY

  // Filters State
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [searchDaily, setSearchDaily] = useState("");
  const [deptDaily, setDeptDaily] = useState("");
  const [roleDaily, setRoleDaily] = useState("");
  const [searchMonthly, setSearchMonthly] = useState("");
  const [deptMonthly, setDeptMonthly] = useState("");
  const [roleMonthly, setRoleMonthly] = useState("");

  // Monthly View State
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch departments and designations
      const [deptRes, roleRes] = await Promise.all([
        fetch("/api/hr/departments/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/hr/designations/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (deptRes.ok) setDepartments(await deptRes.json());
      if (roleRes.ok) setDesignations(await roleRes.json());

      // Fetch active employees
      const empRes = await fetch(
        "/api/hr/employees/?no_pagination=true&status=ACTIVE",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!empRes.ok) throw new Error("Failed to fetch employees");
      const empData = await empRes.json();
      setEmployees(empData);

      // Fetch existing attendance for selected date
      const attendanceRes = await fetch(
        `/api/hr/attendance/?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        const recordsMap = {};
        const notesMap = {};
        attendanceData.forEach((rec) => {
          recordsMap[rec.employee] = rec.status;
          notesMap[rec.employee] = rec.notes || "";
        });
        setAttendanceRecords(recordsMap);
        setNotes(notesMap);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate]);

  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/hr/attendance/?month=${selectedMonth}&year=${selectedYear}`;
      if (searchMonthly) url += `&search=${encodeURIComponent(searchMonthly)}`;
      if (deptMonthly) url += `&department=${deptMonthly}`;
      if (roleMonthly) url += `&designation=${roleMonthly}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch monthly history");
      const data = await res.json();
      setMonthlyRecords(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    selectedMonth,
    selectedYear,
    searchMonthly,
    deptMonthly,
    roleMonthly,
  ]);

  useEffect(() => {
    if (viewMode === "DAILY") {
      fetchData();
    } else {
      fetchMonthlyData();
    }
  }, [viewMode, fetchData, fetchMonthlyData]);

  const handleStatusChange = (empId, status) => {
    setAttendanceRecords((prev) => ({ ...prev, [empId]: status }));
  };

  const handleNoteChange = (empId, note) => {
    setNotes((prev) => ({ ...prev, [empId]: note }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const records = employees.map((emp) => ({
        employee: emp.id,
        status: attendanceRecords[emp.id] || "PRESENT",
        notes: notes[emp.id] || "",
      }));

      const res = await fetch("/api/hr/attendance/bulk_mark/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          records: records,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save attendance");
      }

      setSuccess("Attendance saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Attendance Management"
      subtitle="Track staff presence and half-days."
    >
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setViewMode("DAILY")}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${viewMode === "DAILY" ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"}`}
          >
            Daily Entry
          </button>
          <button
            onClick={() => setViewMode("MONTHLY")}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${viewMode === "MONTHLY" ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"}`}
          >
            Monthly History
          </button>
        </div>

        {viewMode === "DAILY" ? (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  Select Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none font-bold"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || loading || employees.length === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Daily Attendance"}
              </button>
            </div>

            {/* Daily Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Search Employee
                </label>
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={searchDaily}
                  onChange={(e) => setSearchDaily(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-violet-500/50 outline-none text-sm font-medium transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Department
                </label>
                <select
                  value={deptDaily}
                  onChange={(e) => setDeptDaily(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:border-violet-500/50 transition-all text-sm font-medium"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Role
                </label>
                <select
                  value={roleDaily}
                  onChange={(e) => setRoleDaily(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 focus:outline-none focus:border-violet-500/50 transition-all text-sm font-medium"
                >
                  <option value="">All Roles</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 font-bold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 font-bold">
                {success}
              </div>
            )}

            {/* Attendance Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                      S.N
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Loading employees...
                      </td>
                    </tr>
                  ) : employees.filter((emp) => {
                      const matchesSearch = emp.full_name
                        .toLowerCase()
                        .includes(searchDaily.toLowerCase());
                      const matchesDept =
                        !deptDaily ||
                        String(emp.department) === String(deptDaily);
                      const matchesRole =
                        !roleDaily ||
                        String(emp.designation) === String(roleDaily);
                      return matchesSearch && matchesDept && matchesRole;
                    }).length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        No active employees found matching filters.
                      </td>
                    </tr>
                  ) : (
                    employees
                      .filter((emp) => {
                        const matchesSearch = emp.full_name
                          .toLowerCase()
                          .includes(searchDaily.toLowerCase());
                        const matchesDept =
                          !deptDaily ||
                          String(emp.department) === String(deptDaily);
                        const matchesRole =
                          !roleDaily ||
                          String(emp.designation) === String(roleDaily);
                        return matchesSearch && matchesDept && matchesRole;
                      })
                      .map((emp, idx) => (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-xs font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">
                              {emp.full_name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              {emp.designation_name} • {emp.department_name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {STATUS_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() =>
                                    handleStatusChange(emp.id, opt.value)
                                  }
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${attendanceRecords[emp.id] === opt.value ? `${opt.color} text-white shadow-md` : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={notes[emp.id] || ""}
                              onChange={(e) =>
                                handleNoteChange(emp.id, e.target.value)
                              }
                              placeholder="Add notes..."
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-violet-500/50 outline-none text-sm font-medium transition-all"
                            />
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Monthly Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Search Employee
                </label>
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={searchMonthly}
                  onChange={(e) => setSearchMonthly(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none text-sm font-medium transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Dept
                </label>
                <select
                  value={deptMonthly}
                  onChange={(e) => setDeptMonthly(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-xs font-bold"
                >
                  <option value="">All</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Role
                </label>
                <select
                  value={roleMonthly}
                  onChange={(e) => setRoleMonthly(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-xs font-bold"
                >
                  <option value="">All</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-slate-50 px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-xs font-bold"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", {
                          month: "short",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-slate-50 px-2 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-xs font-bold"
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Monthly History Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                      S.N
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Loading history...
                      </td>
                    </tr>
                  ) : monthlyRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        No records found for this period.
                      </td>
                    </tr>
                  ) : (
                    monthlyRecords.map((rec, idx) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {new Date(rec.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {rec.employee_name}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${STATUS_OPTIONS.find((o) => o.value === rec.status)?.color}`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {rec.notes || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
