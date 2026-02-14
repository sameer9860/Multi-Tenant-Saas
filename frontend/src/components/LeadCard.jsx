import React from "react";
import { useDraggable } from "@dnd-kit/core";

export const LeadCard = ({ lead }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id.toString(),
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-3"
    >
      <h3 className="font-semibold text-gray-800">{lead.name}</h3>
      {lead.email && (
        <p className="text-sm text-gray-500 mt-1 truncate">{lead.email}</p>
      )}
      {lead.source && (
        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
          {lead.source}
        </span>
      )}
    </div>
  );
};
