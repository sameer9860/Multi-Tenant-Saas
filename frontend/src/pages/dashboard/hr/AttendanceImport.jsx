import React, { useState } from "react";

const AttendanceImport = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const token = localStorage.getItem("token");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/hr/attendance/import_csv/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload CSV.");
      }

      setResult(data);
      if (data.success_count > 0) {
        onImportSuccess();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-600 to-violet-700">
          <h2 className="text-xl font-black text-white">
            Import Attendance (CSV)
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
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
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-8">
          {!result ? (
            <div className="space-y-6">
              <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100">
                <h3 className="text-sm font-bold text-violet-800 mb-2">
                  Instructions:
                </h3>
                <ul className="text-xs text-violet-600 space-y-1 list-disc pl-4">
                  <li>
                    CSV must have headers:{" "}
                    <strong>Employee Name, Date, Status</strong>
                  </li>
                  <li>
                    Optional header: <strong>Notes</strong>
                  </li>
                  <li>
                    Date format: <strong>YYYY-MM-DD</strong> (e.g., 2026-03-01)
                  </li>
                  <li>
                    Status options:{" "}
                    <strong>Present, Absent, Leave, Half_Day</strong>
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-4 py-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-violet-500 transition-colors cursor-pointer text-sm font-medium text-slate-500"
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-bold">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {uploading ? "Importing..." : "Start Import"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Import Completed
                </h3>
                <p className="text-slate-500 text-sm mt-1">{result.message}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3">
                  <p className="text-2xl font-black text-emerald-600">
                    {result.success_count}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                    Successful Records
                  </p>
                </div>
                <div className="text-center p-3 border-l border-slate-200">
                  <p className="text-2xl font-black text-rose-600">
                    {result.error_count}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                    Failed Rows
                  </p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="text-left max-h-40 overflow-y-auto bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <p className="text-xs font-black text-rose-800 uppercase tracking-widest mb-2">
                    Error Details:
                  </p>
                  <ul className="text-[11px] text-rose-600 space-y-1 list-disc pl-4">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98]"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceImport;
