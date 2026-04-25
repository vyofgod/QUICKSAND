"use client";

import { useDroppable } from "@dnd-kit/core";
import { type Task, type TaskStatus } from "@/lib/db-schema";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
}

export function TaskColumn({ status, title, tasks }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 rounded-lg border-2 border-dashed bg-muted/20 p-3 transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground">{tasks.length}</span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Drop tasks here
        </div>
      )}
    </div>
  );
}
