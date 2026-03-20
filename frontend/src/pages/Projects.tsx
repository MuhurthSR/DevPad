import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, GripVertical, Trash2, Edit3, X } from "lucide-react";

interface KanbanCard {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  tags: string[];
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-destructive/20 text-destructive",
};

const initialColumns: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    cards: [
      { id: "c1", title: "Design system tokens", description: "Finalize color palette and spacing scale", priority: "medium", tags: ["design"] },
      { id: "c2", title: "WebSocket integration", description: "Real-time updates for collaborative editing", priority: "low", tags: ["backend"] },
    ],
  },
  {
    id: "todo",
    title: "To Do",
    cards: [
      { id: "c3", title: "Auth flow redesign", description: "Implement OAuth2 with PKCE", priority: "high", tags: ["auth", "security"] },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      { id: "c4", title: "Kanban drag & drop", description: "Implement card reordering across columns", priority: "high", tags: ["frontend"] },
      { id: "c5", title: "API rate limiter", description: "Token bucket algorithm for /api/v3", priority: "medium", tags: ["backend"] },
    ],
  },
  {
    id: "blocked",
    title: "Blocked",
    cards: [
      { id: "c6", title: "CI/CD pipeline", description: "Waiting on DevOps approval for staging env", priority: "high", tags: ["infra"] },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      { id: "c7", title: "Database migration", description: "Migrated to PostgreSQL 16", priority: "medium", tags: ["backend"] },
    ],
  },
];

const Projects = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; fromCol: string } | null>(null);
  const [showNewCard, setShowNewCard] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");

  const handleDragStart = (cardId: string, fromCol: string) => {
    setDraggedCard({ cardId, fromCol });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(
    (toColId: string) => {
      if (!draggedCard) return;
      const { cardId, fromCol } = draggedCard;
      if (fromCol === toColId) { setDraggedCard(null); return; }

      setColumns((prev) => {
        const sourceCol = prev.find((c) => c.id === fromCol);
        const card = sourceCol?.cards.find((c) => c.id === cardId);
        if (!card) return prev;

        return prev.map((col) => {
          if (col.id === fromCol) return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
          if (col.id === toColId) return { ...col, cards: [...col.cards, card] };
          return col;
        });
      });
      setDraggedCard(null);
    },
    [draggedCard]
  );

  const addCard = (colId: string) => {
    if (!newCardTitle.trim()) return;
    const newCard: KanbanCard = {
      id: Date.now().toString(),
      title: newCardTitle,
      description: "",
      priority: "medium",
      tags: [],
    };
    setColumns(
      columns.map((col) =>
        col.id === colId ? { ...col, cards: [...col.cards, newCard] } : col
      )
    );
    setNewCardTitle("");
    setShowNewCard(null);
  };

  const deleteCard = (colId: string, cardId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === colId ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) } : col
      )
    );
  };

  const totalCards = columns.reduce((sum, col) => sum + col.cards.length, 0);
  const doneCards = columns.find((c) => c.id === "done")?.cards.length ?? 0;

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="text-xs text-muted-foreground font-mono tabular-nums mt-1">
            Sprint 14 • {doneCards}/{totalCards} tasks complete • {Math.round((doneCards / totalCards) * 100)}%
          </p>
        </div>
      </div>

      {/* Sprint progress */}
      <div className="mb-6">
        <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(doneCards / totalCards) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] }}
          />
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(col.id)}
            className="w-[280px] shrink-0 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {col.title}
                </span>
                <span className="text-2xs font-mono tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {col.cards.length}
                </span>
              </div>
              <button
                onClick={() => setShowNewCard(showNewCard === col.id ? null : col.id)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              {/* New card input */}
              {showNewCard === col.id && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface rounded-lg p-3 card-depth"
                >
                  <input
                    autoFocus
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCard(col.id);
                      if (e.key === "Escape") setShowNewCard(null);
                    }}
                    placeholder="Card title..."
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none mb-2"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => addCard(col.id)}
                      className="bg-primary text-primary-foreground rounded px-2.5 py-1 text-2xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowNewCard(null)}
                      className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-2xs transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )}

              {col.cards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  draggable
                  onDragStart={() => handleDragStart(card.id, col.id)}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="bg-surface rounded-lg p-3 card-depth hover:card-depth-hover cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <GripVertical size={12} className="text-muted-foreground/40 shrink-0" />
                      <span className="text-sm font-medium text-foreground">{card.title}</span>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => deleteCard(col.id, card.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {card.description && (
                    <p className="text-2xs text-muted-foreground mb-2 pl-[18px]">{card.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 pl-[18px]">
                    <span className={`text-2xs px-1.5 py-0.5 rounded font-medium ${priorityColors[card.priority]}`}>
                      {card.priority}
                    </span>
                    {card.tags.map((tag) => (
                      <span key={tag} className="text-2xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
