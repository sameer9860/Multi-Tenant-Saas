import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { LeadCard } from "./LeadCard";

export const Column = ({ status, title, leads }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
          {title}
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">
            {leads.length}
          </span>
        </h2>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 bg-slate-100/50 rounded-2xl p-3 border border-slate-200/50"
      >
        <div className="flex flex-col gap-1 min-h-[200px]">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic p-4">
              Drop items here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
