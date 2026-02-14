import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { LeadCard } from "./LeadCard";

export const Column = ({ status, title, leads }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const getStatusStyles = (status) => {
    switch (status) {
      case "NEW":
        return {
          header: "text-blue-700",
          badge: "bg-blue-100 text-blue-700",
          bg: "bg-blue-50/50 border-blue-100/50",
        };
      case "CONTACTED":
        return {
          header: "text-amber-700",
          badge: "bg-amber-100 text-amber-700",
          bg: "bg-amber-50/50 border-amber-100/50",
        };
      case "CONVERTED":
        return {
          header: "text-emerald-700",
          badge: "bg-emerald-100 text-emerald-700",
          bg: "bg-emerald-50/50 border-emerald-100/50",
        };
      case "LOST":
        return {
          header: "text-rose-700",
          badge: "bg-rose-100 text-rose-700",
          bg: "bg-rose-50/50 border-rose-100/50",
        };
      default:
        return {
          header: "text-slate-700",
          badge: "bg-slate-100 text-slate-700",
          bg: "bg-slate-100/50 border-slate-200/50",
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2
          className={`font-black text-sm tracking-wide uppercase ${styles.header} flex items-center gap-2`}
        >
          {title}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles.badge}`}
          >
            {leads.length}
          </span>
        </h2>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 ${styles.bg} rounded-2xl p-3 border shadow-inner transition-colors`}
      >
        <div className="flex flex-col gap-3 min-h-[100px]">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400/60 text-sm font-medium italic p-8 border-2 border-dashed border-slate-200 rounded-xl">
              Drop items here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
