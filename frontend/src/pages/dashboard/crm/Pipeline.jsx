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

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const response = await fetch("/api/crm/leads/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch leads");

      const data = await response.json();
      setLeads(data);
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
      // Optional: Add a toast notification here
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

  const groupedLeads = {
    NEW: leads.filter((l) => l.status === "NEW"),
    CONTACTED: leads.filter((l) => l.status === "CONTACTED"),
    CONVERTED: leads.filter((l) => l.status === "CONVERTED"),
    LOST: leads.filter((l) => l.status === "LOST"),
  };

  const activeLead = activeId
    ? leads.find((l) => l.id.toString() === activeId)
    : null;

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">Loading pipeline...</div>
    );
  if (error)
    return <div className="p-8 text-center text-rose-500">Error: {error}</div>;

  return (
    <div className="p-8 h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          Deals Pipeline
        </h1>
        <p className="text-slate-500">
          Drag and drop leads to update their status
        </p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-250px)] overflow-x-auto pb-4">
          <Column status="NEW" title="New Leads" leads={groupedLeads.NEW} />
          <Column
            status="CONTACTED"
            title="Contacted"
            leads={groupedLeads.CONTACTED}
          />
          <Column
            status="CONVERTED"
            title="Converted"
            leads={groupedLeads.CONVERTED}
          />
          <Column status="LOST" title="Lost" leads={groupedLeads.LOST} />
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Pipeline;
