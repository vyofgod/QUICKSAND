"use client";

import { useDraggable } from "@dnd-kit/core";
import { type Task } from "@/lib/db-schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GripVertical, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityColors = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab p-3 active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <div {...listeners} {...attributes} className="cursor-grab pt-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium leading-tight">{task.title}</h4>
            <div
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                priorityColors[task.priority]
              )}
              title={task.priority}
            />
          </div>

          {task.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}

          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
