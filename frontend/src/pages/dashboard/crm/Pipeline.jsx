import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { Column } from "../../../components/Column";
import { LeadCard } from "../../../components/LeadCard";
import DashboardLayout from "../../../components/DashboardLayout";

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/crm/leads/?no_pagination=true", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch leads");

      const data = await response.json();
      setLeads(data.results || data);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = parseInt(active.id);
    const newStatus = over.id;
    const lead = leads.find((l) => l.id === leadId);

    if (!lead || lead.status === newStatus) return;

    // Business Rules: Prevent moving from LOST/CONVERTED to NEW
    if (
      (lead.status === "LOST" || lead.status === "CONVERTED") &&
      newStatus === "NEW"
    ) {
      console.warn("Cannot move from LOST/CONVERTED to NEW");
      return;
    }

    // Optimistic update
    const previousLeads = [...leads];
    setLeads(
      leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    );

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/crm/leads/${leadId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error("Update failed:", err);
      // Revert optimism
      setLeads(previousLeads);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    return (
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email &&
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm))
    );
  });

  const groupedLeads = {
    NEW: filteredLeads.filter((l) => l.status === "NEW"),
    CONTACTED: filteredLeads.filter((l) => l.status === "CONTACTED"),
    INTERESTED: filteredLeads.filter((l) => l.status === "INTERESTED"),
    CONVERTED: filteredLeads.filter((l) => l.status === "CONVERTED"),
    LOST: filteredLeads.filter((l) => l.status === "LOST"),
  };

  const activeLead = activeId
    ? leads.find((l) => l.id.toString() === activeId)
    : null;

  if (loading)
    return (
      <DashboardLayout title="Deals Pipeline">
        <div className="p-8 text-center text-slate-500">
          Loading pipeline...
        </div>
      </DashboardLayout>
    );
  if (error)
    return (
      <DashboardLayout title="Deals Pipeline">
        <div className="p-8 text-center text-rose-500">Error: {error}</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout
      title="Deals Pipeline"
      subtitle="Drag and drop leads to update their status"
    >
      <div className="h-full">
        {/* Search Bar */}
        <div className="mb-6 max-w-md">
          <div className="relative group">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              xmlns="http://www.w3.org/2000/svg"
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
            <input
              type="text"
              placeholder="Search leads in pipeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 bg-white"
            />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-[calc(100vh-250px)] overflow-x-auto pb-4 min-w-[1200px]">
            <Column
              status="NEW"
              title="New Leads"
              leads={groupedLeads.NEW || []}
            />
            <Column
              status="CONTACTED"
              title="Contacted"
              leads={groupedLeads.CONTACTED || []}
            />
            <Column
              status="INTERESTED"
              title="Interested"
              leads={groupedLeads.INTERESTED || []}
            />
            <Column
              status="CONVERTED"
              title="Converted"
              leads={groupedLeads.CONVERTED || []}
            />
            <Column
              status="LOST"
              title="Lost"
              leads={groupedLeads.LOST || []}
            />
          </div>

          <DragOverlay>
            {activeLead ? <LeadCard lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </DashboardLayout>
  );
};

export default Pipeline;
