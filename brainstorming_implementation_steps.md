# Brainstorming Integration: Action Steps

Since we've covered the "Why" and the "How" in your Handbook, here are the exact, copy-paste steps you need to take to apply this code to your project perfectly. The code is heavily commented to reference specific chapters in the **Brainstorming Integration Handbook**, so you can easily tie the code back to the theory!

## Step 1: Clean up `ProjectsContext.tsx`

**Action:** Open `frontend/src/context/ProjectsContext.tsx` and replace its **entire contents** with this clean version:

```tsx
import React, { createContext, useContext, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

// 📘 Handbook Part 1: The Core Philosophy of Server State
// Notice how the 'Idea' type and 'ideas' array are GONE from this context.
// We are no longer managing them via Client State since they belong to the Server!
interface ProjectsContextState {
  activeProjectIds: string[];
  openProject: (id: string) => void;
  closeProject: (id: string) => void;
  reorderProjects: (oldIndex: number, newIndex: number) => void;
}

const ProjectsContext = createContext<ProjectsContextState | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>(["1", "2"]);

  const openProject = (id: string) => {
    setActiveProjectIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const closeProject = (id: string) => {
    setActiveProjectIds((prev) => prev.filter(pid => pid !== id));
  };

  const reorderProjects = (oldIndex: number, newIndex: number) => {
    setActiveProjectIds((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  return (
    <ProjectsContext.Provider
      value={{
        activeProjectIds,
        openProject,
        closeProject,
        reorderProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
};
```

---

## Step 2: Implement full logic in `Brainstorming.tsx`

**Action:** Open `frontend/src/pages/Brainstorming.tsx` and replace its **entire contents** with this code:

```tsx
import React, { useState, forwardRef, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lightbulb, X, GripHorizontal } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Idea {
  id: string;
  text: string;
  color: string;
}

interface IdeaCanvasEntry {
  dbId: string | null;
  content: string;
}

const IDEA_COLORS = [
  "hsl(var(--chart-1) / 0.15)",
  "hsl(var(--chart-2) / 0.15)",
  "hsl(var(--chart-3) / 0.15)",
  "hsl(var(--chart-4) / 0.15)",
  "hsl(var(--chart-5) / 0.15)",
];

const randomColor = () => IDEA_COLORS[Math.floor(Math.random() * IDEA_COLORS.length)];

interface CanvasCardProps {
  idea: Idea;
  content: string;
  onContentChange?: (val: string) => void;
  onClose?: () => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  isOverlay?: boolean;
  attributes?: any;
  listeners?: any;
  onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const CanvasCard = forwardRef<HTMLDivElement, CanvasCardProps>(
  ({ idea, content, onContentChange, onClose, style, isDragging, isOverlay, attributes, listeners, onMouseUp }, ref) => {
    return (
      <div
        ref={ref}
        style={style}
        onMouseUp={onMouseUp}
        className={`flex-grow-0 flex-shrink min-w-[300px] max-w-full rounded-lg bg-surface card-depth resize flex flex-col border 
          ${isDragging && !isOverlay ? 'border-primary opacity-30 shadow-none pointer-events-none' : 'border-transparent'} 
          ${isOverlay ? 'border-primary cursor-grabbing shadow-2xl scale-105 z-50' : ''} 
          focus-within:border-primary/50 relative origin-top-left`}
      >
        <div
          className={`flex items-center justify-between px-5 py-3 border-b border-sidebar-border shrink-0 opacity-80 
            ${isOverlay ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing hover:bg-surface-hover/50 transition-colors pointer-events-auto'}`}
          {...attributes}
          {...listeners}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal size={14} className="text-muted-foreground mr-1 shrink-0" />
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: idea.color.includes("/") ? idea.color.replace("/ 0.15)", "/ 1)") : idea.color }}
            />
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">
              {idea.text}
            </span>
          </div>
          {!isOverlay && onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 z-10"
            >
              Close
            </button>
          )}
        </div>
        <textarea
          value={content}
          onChange={(e) => onContentChange && onContentChange(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          readOnly={isOverlay}
          className="w-full flex-1 px-5 py-4 font-mono text-sm leading-relaxed text-foreground bg-transparent focus:outline-none resize-none cursor-text pointer-events-auto"
          spellCheck={false}
          placeholder={`Expand on your idea: "${idea.text}"...`}
        />
      </div>
    );
  }
);
CanvasCard.displayName = "CanvasCard";

interface SortableCanvasProps {
  id: string;
  idea: Idea;
  content: string;
  onContentChange: (val: string) => void;
  onClose: () => void;
  onResize: (width: number, height: number) => void;
}

const SortableCanvasItem = ({ id, idea, content, onContentChange, onClose, onResize }: SortableCanvasProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : 1,
    width: "450px",
    height: "400px",
    overflow: "hidden"
  };

  return (
    <CanvasCard
      ref={setNodeRef}
      style={style}
      idea={idea}
      content={content}
      onContentChange={onContentChange}
      onClose={onClose}
      isDragging={isDragging}
      attributes={attributes}
      listeners={listeners}
      onMouseUp={(e) => {
        const el = e.currentTarget;
        onResize(el.offsetWidth, el.offsetHeight);
      }}
    />
  );
};

const Brainstorming = () => {
  // 📘 Handbook Part 2: The Setup and queryClient
  // The query client is the manager that holds the keys to the cache boxes!
  const queryClient = useQueryClient();

  const [newIdea, setNewIdea] = useState("");
  
  // 📘 Handbook Part 3.2: The Naming Collision
  // We renamed `canvas` to `mainCanvasContent` to prevent collision with the `canvas` object returned by the API
  const [mainCanvasContent, setMainCanvasContent] = useState("");
  const [openCanvases, setOpenCanvases] = useState<string[]>([]);
  const [ideaCanvasContents, setIdeaCanvasContents] = useState<Record<string, IdeaCanvasEntry>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  // 📘 Handbook Part 4.2: Debouncing Text 
  // We use these refs to store setTimeout stopwatches
  const mainCanvasTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ideaCanvasTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 📘 Handbook Part 3.1: Fetching the Ideas
  const { data: ideasData, isLoading: ideasLoading } = useQuery({
    queryKey: ["brainstorm-ideas"],
    queryFn: () => api.get("/api/brainstorming/ideas"),
  });

  const ideas: Idea[] = (ideasData?.ideas ?? []).map((i: any) => ({
    id: String(i.idea_id),
    text: i.idea,
    color: i.color_theme,
  }));

  // 📘 Handbook Part 3.2: Fetching the Main Canvas
  const { data: mainCanvasData } = useQuery({
    queryKey: ["brainstorm-main-canvas"],
    queryFn: () => api.get("/api/brainstorming/canvas/main"),
  });

  // 📘 Handbook Part 3.2: The Sync Challenge
  // When mainCanvasData finishes fetching, inject it into the text state
  useEffect(() => {
    if (mainCanvasData?.canvas?.content !== undefined) {
      setMainCanvasContent(mainCanvasData.canvas.content ?? "");
    }
  }, [mainCanvasData]);

  // 📘 Handbook Part 4.1: Adding an Idea
  const addIdeaMutation = useMutation({
    mutationFn: (ideaText: string) =>
      api.post("/api/brainstorming/ideas", {
        idea: ideaText,
        color_theme: randomColor(),
      }),
    onSuccess: () => {
      // 💡 THE MAGIC TRICK: This tells the queryClient to throw out the old ideas box and fetch a fresh one!
      queryClient.invalidateQueries({ queryKey: ["brainstorm-ideas"] });
      setNewIdea("");
    },
  });

  const removeIdeaMutation = useMutation({
    mutationFn: (ideaId: string) =>
      api.delete(`/api/brainstorming/ideas/${ideaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brainstorm-ideas"] });
    },
  });

  // 📘 Handbook Part 4.1: Matching the Controller Payload
  // Pay attention to the { content, width, height } matching your backend's req.body!
  const saveMainCanvasMutation = useMutation({
    mutationFn: ({ content, width, height }: { content?: string; width?: number; height?: number }) =>
      api.patch("/api/brainstorming/canvas/main", { content, width, height }),
  });

  const saveIdeaCanvasMutation = useMutation({
    mutationFn: ({ canvasId, content, width, height }: { canvasId: string; content?: string; width?: number; height?: number }) =>
      api.patch(`/api/brainstorming/canvas/${canvasId}`, { content, width, height }),
  });

  const reorderCanvasMutation = useMutation({
    mutationFn: (order: { id: string; sort_order: number }[]) =>
      api.patch("/api/brainstorming/canvas/order", { order }),
  });

  const addIdea = () => {
    if (!newIdea.trim()) return;
    addIdeaMutation.mutate(newIdea);
  };

  const removeIdea = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeIdeaMutation.mutate(id);
    setOpenCanvases(prev => prev.filter((c) => c !== id));
  };

  // 📘 Handbook Part 5.1: Dynamic Idea Canvases
  const handleIdeaClick = async (id: string) => {
    if (!openCanvases.includes(id)) {
      // 1. Fetch data manually because this is an explicit one-time click event
      const result = await api.get(`/api/brainstorming/canvas/idea/${id}`);
      const fetchedCanvas = result.canvas;

      setIdeaCanvasContents(prev => ({
        ...prev,
        [id]: {
          dbId: String(fetchedCanvas.id),
          content: fetchedCanvas.content ?? "",
        },
      }));

      setOpenCanvases(prev => [...prev, id]);
    }

    setTimeout(() => {
      document.getElementById(`canvas-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // 📘 Handbook Part 4.2: Debouncing text
  const handleMainCanvasChange = (value: string) => {
    setMainCanvasContent(value); // This makes the UI feel instant

    if (mainCanvasTimer.current) clearTimeout(mainCanvasTimer.current);

    mainCanvasTimer.current = setTimeout(() => {
      saveMainCanvasMutation.mutate({ content: value });
    }, 1000);
  };

  const handleIdeaCanvasChange = (ideaId: string, value: string) => {
    const dbId = ideaCanvasContents[ideaId]?.dbId;

    setIdeaCanvasContents(prev => ({
      ...prev,
      [ideaId]: { ...prev[ideaId], content: value },
    }));

    if (!dbId) return;

    if (ideaCanvasTimers.current[ideaId]) clearTimeout(ideaCanvasTimers.current[ideaId]);

    ideaCanvasTimers.current[ideaId] = setTimeout(() => {
      saveIdeaCanvasMutation.mutate({ canvasId: dbId, content: value });
    }, 1000);
  };

  const handleIdeaCanvasResize = (ideaId: string, width: number, height: number) => {
    const dbId = ideaCanvasContents[ideaId]?.dbId;
    if (!dbId) return;
    saveIdeaCanvasMutation.mutate({ canvasId: dbId, width, height });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 📘 Handbook Part 5.2: Optimistic Drag and Drop
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOpenCanvases((items) => {
      // 1. Optimistic UI Update: We immediately reorder the local browser array.
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      const reordered = arrayMove(items, oldIndex, newIndex);

      // 2. Build the database payload cleanly formatting `{ order: orderPayload }`
      const orderPayload = reordered
        .map((ideaId, index) => {
          const dbId = ideaCanvasContents[ideaId]?.dbId;
          if (!dbId) return null;
          return { id: dbId, sort_order: index };
        })
        .filter((item): item is { id: string; sort_order: number } => item !== null);

      if (orderPayload.length > 0) {
        // 3. Send it to the server quietly.
        reorderCanvasMutation.mutate(orderPayload);
      }

      return reordered;
    });
  };

  const handleDragCancel = () => setActiveId(null);

  const activeIdea = activeId ? ideas.find(i => i.id === activeId) : null;

  if (ideasLoading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Brainstorming</h1>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-24 bg-surface rounded-lg card-depth animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Brainstorming</h1>
        <p className="text-xs text-muted-foreground mt-1">Capture ideas, explore possibilities.</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-primary" />
          <span className="text-xs text-muted-foreground">Quick Ideas</span>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIdea()}
            placeholder="Drop an idea..."
            className="flex-1 bg-surface rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={addIdea}
            disabled={addIdeaMutation.isPending}
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {ideas.map((idea) => (
              <motion.div
                key={idea.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleIdeaClick(idea.id)}
                className="px-3 py-2 rounded-lg text-xs text-foreground cursor-pointer transition-shadow card-depth hover:card-depth-hover flex items-center gap-2 group"
                style={{ backgroundColor: idea.color }}
              >
                <span>{idea.text}</span>
                <button
                  onClick={(e) => removeIdea(idea.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-foreground/80 transition-opacity ml-1"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-wrap gap-4 pb-24 items-start relative focus-within:z-10">

          <div
            onMouseUp={(e) => {
              const el = e.currentTarget;
              saveMainCanvasMutation.mutate({
                width: el.offsetWidth,
                height: el.offsetHeight,
              });
            }}
            className="flex-grow-0 flex-shrink min-w-[300px] max-w-full rounded-xl bg-surface card-depth resize overflow-hidden flex flex-col border border-border focus-within:border-primary/50 transition-colors"
            style={{
              width: mainCanvasData?.canvas?.width ?? 450,
              height: mainCanvasData?.canvas?.height ?? 400,
            }}
          >
            <div className="px-5 py-3 border-b border-sidebar-border shrink-0 opacity-80">
              <span className="text-xs text-muted-foreground mb-0 block font-medium">Main Canvas</span>
            </div>
            <textarea
              value={mainCanvasContent}
              onChange={(e) => handleMainCanvasChange(e.target.value)}
              className="w-full flex-1 px-5 py-4 font-mono text-sm leading-relaxed text-foreground bg-transparent focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <SortableContext items={openCanvases} strategy={rectSortingStrategy}>
            {openCanvases.map(id => {
              const idea = ideas.find(i => i.id === id);
              if (!idea) return null;
              return (
                <SortableCanvasItem
                  key={id}
                  id={id}
                  idea={idea}
                  content={ideaCanvasContents[id]?.content ?? ""}
                  onContentChange={(val) => handleIdeaCanvasChange(id, val)}
                  onClose={() => setOpenCanvases(prev => prev.filter(cId => cId !== id))}
                  onResize={(w, h) => handleIdeaCanvasResize(id, w, h)}
                />
              );
            })}
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={{ duration: 250, easing: 'ease' }}>
          {activeId && activeIdea ? (
            <CanvasCard
              idea={activeIdea}
              content={ideaCanvasContents[activeId]?.content ?? ""}
              isOverlay
              style={{ width: "450px", height: "400px" }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Brainstorming;
```

---

That's it! Just copy these two blocks, save the files, and you have successfully upgraded your app with `react-query`!
