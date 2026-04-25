"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskColumn } from "./task-column";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskStatus } from "@/lib/db-schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TaskCard } from "./task-card";

const columns = [
  { id: TaskStatus.TODO, title: "To Do" },
  { id: TaskStatus.IN_PROGRESS, title: "In Progress" },
  { id: TaskStatus.IN_REVIEW, title: "In Review" },
  { id: TaskStatus.DONE, title: "Done" },
];

export function TaskBoard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: tasks, isLoading } = trpc.task.getAll.useQuery();
  const updatePositions = trpc.task.updatePositions.useMutation();
  const utils = trpc.useUtils();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeTask = tasks?.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overStatus = over.id as TaskStatus;
    const tasksInColumn = tasks?.filter((t) => t.status === overStatus) ?? [];
    const newPosition = tasksInColumn.length;

    // Optimistic update
    utils.task.getAll.setData(undefined, (old) => {
      if (!old) return old;
      return old.map((task) =>
        task.id === activeTask.id
          ? { ...task, status: overStatus, position: newPosition }
          : task
      );
    });

    // Update on server
    try {
      await updatePositions.mutateAsync({
        updates: [
          {
            id: activeTask.id,
            status: overStatus,
            position: newPosition,
          },
        ],
      });
    } catch (error) {
      // Revert on error
      utils.task.getAll.invalidate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[400px]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeTask = tasks?.find((t) => t.id === activeId);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Task Board</CardTitle>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-4 md:grid-cols-4">
              {columns.map((column) => (
                <TaskColumn
                  key={column.id}
                  status={column.id}
                  title={column.title}
                  tasks={tasks?.filter((t) => t.status === column.id) ?? []}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
