import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GripVertical, Trash2, Edit3, X, ChevronDown, Check, Search, FolderKanban, ArrowRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext";

interface KanbanCard {
  id: string;
  title: string;
  description: string; // Maps to 'context' in DB
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

// Mock columns
const getInitialColumns = (): KanbanColumn[] => [
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
    id: "in_progress",
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { ideas, activeProjectIds, openProject } = useProjects();
  
  // Only attempt to render a Kanban board if an explicit ID is provided in the URL. 
  // Otherwise, fallback to the Hub view.
  const currentIdea = id ? ideas.find(i => i.id === id) : null;

  const [columns, setColumns] = useState<KanbanColumn[]>(getInitialColumns());
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; fromCol: string } | null>(null);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Card Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [cardFormData, setCardFormData] = useState<Partial<KanbanCard>>({});
  const [tagInput, setTagInput] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProject = (ideaId: string) => {
    openProject(ideaId);
    setDropdownOpen(false);
    navigate(`/projects/${ideaId}`);
  };

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

  const deleteCard = (colId: string, cardId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === colId ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) } : col
      )
    );
  };

  const openCreateModal = (colId: string) => {
    setModalMode("create");
    setActiveColId(colId);
    setCardFormData({ title: "", description: "", priority: "medium", tags: [] });
    setTagInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (colId: string, card: KanbanCard) => {
    setModalMode("edit");
    setActiveColId(colId);
    setCardFormData({ ...card });
    setTagInput("");
    setIsModalOpen(true);
  };

  const handleSaveCard = () => {
    if (!cardFormData.title?.trim() || !activeColId) return;

    if (modalMode === "create") {
      const newCard: KanbanCard = {
        id: Date.now().toString(),
        title: cardFormData.title,
        description: cardFormData.description || "",
        priority: cardFormData.priority || "medium",
        tags: cardFormData.tags || [],
      };
      setColumns(
        columns.map((col) =>
          col.id === activeColId ? { ...col, cards: [...col.cards, newCard] } : col
        )
      );
    } else {
      // Edit
      setColumns(
        columns.map((col) => {
          if (col.id === activeColId) {
            return {
              ...col,
              cards: col.cards.map(c => c.id === cardFormData.id ? (cardFormData as KanbanCard) : c)
            };
          }
          return col;
        })
      );
    }
    setIsModalOpen(false);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!cardFormData.tags?.includes(tagInput.trim())) {
        setCardFormData({ ...cardFormData, tags: [...(cardFormData.tags || []), tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCardFormData({
      ...cardFormData,
      tags: cardFormData.tags?.filter(t => t !== tagToRemove) || []
    });
  };

  if (!currentIdea) {
    if (ideas.length > 0) {
      return (
        <div className="p-8 h-screen w-full overflow-y-auto bg-background/50">
          <div className="max-w-6xl w-full mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner shrink-0">
                <FolderKanban size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Project Hub</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Select a brainstormed idea to spin up its Kanban board.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ideas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => {
                    openProject(idea.id);
                    navigate(`/projects/${idea.id}`);
                  }}
                  className="flex flex-col items-start px-5 py-5 bg-surface border border-border rounded-xl card-depth hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 transition-all group text-left h-36 relative overflow-hidden"
                >
                  <div 
                    className="absolute top-0 left-0 w-full h-1 opacity-80" 
                    style={{ backgroundColor: idea.color.includes("/") ? idea.color.replace("/ 0.15)", "/ 1)") : idea.color }}
                  />
                  
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-border/50 mb-3 bg-background group-hover:scale-110 transition-transform shadow-sm">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: idea.color.includes("/") ? idea.color.replace("/ 0.15)", "/ 1)") : idea.color }}
                    />
                  </div>
                  
                  <span className="font-semibold text-[15px] tracking-tight text-foreground line-clamp-2 w-full leading-snug mb-3">{idea.text}</span>
                  
                  <div className="mt-auto w-full flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Active</span>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 h-screen flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mb-6">
          <FolderKanban size={32} />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">No Ideas Found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Head over to the Brainstorming tab to create some Ideas, then come back here to plan them out!
        </p>
      </div>
    );
  }

  const totalCards = columns.reduce((sum, col) => sum + col.cards.length, 0);
  const doneCards = columns.find((c) => c.id === "done")?.cards.length ?? 0;
  const filteredIdeas = ideas.filter(idea => idea.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-6 h-screen flex flex-col relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          {/* Dynamic Dropdown Title */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 group hover:bg-surface-hover/50 -ml-1.5 px-1.5 py-1 rounded-md transition-colors"
            >
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{currentIdea.text}</h1>
              <ChevronDown size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg card-depth shadow-2xl z-50 py-1 overflow-hidden"
                >
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-surface/50 border-b border-border/50">
                    Switch Project
                  </div>

                  {/* Search Input */}
                  <div className="px-2 py-1.5 border-b border-border/50">
                    <div className="flex items-center bg-surface rounded px-2 py-1.5 focus-within:ring-1 focus-within:ring-primary/50">
                      <Search size={14} className="text-muted-foreground mr-2 shrink-0" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ideas..."
                        className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {filteredIdeas.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground italic text-center">No ideas found.</p>
                    ) : (
                      filteredIdeas.map((idea) => (
                        <button
                          key={idea.id}
                          onClick={() => handleSelectProject(idea.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-surface-hover transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: idea.color.includes("/") ? idea.color.replace("/ 0.15)", "/ 1)") : idea.color }}
                            />
                            <span className="truncate">{idea.text}</span>
                          </div>
                          {currentIdea.id === idea.id && <Check size={14} className="text-primary shrink-0 ml-2" />}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <p className="text-xs text-muted-foreground font-mono tabular-nums mt-1">
            {doneCards}/{totalCards} tasks complete • {totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Sprint progress */}
      <div className="mb-6">
        <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${totalCards > 0 ? (doneCards / totalCards) * 100 : 0}%` }}
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
                onClick={() => openCreateModal(col.id)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 space-y-2 pb-10">
              {col.cards.map((card) => (
                <motion.div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id, col.id)}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="bg-surface rounded-lg p-3 card-depth hover:card-depth-hover cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-start justify-between mb-1.5 gap-2">
                    <div className="flex items-start gap-1.5 mt-0.5">
                      <GripVertical size={12} className="text-muted-foreground/40 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-foreground leading-tight">{card.title}</span>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        onClick={() => openEditModal(col.id, card)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => deleteCard(col.id, card.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {card.description && (
                    <p className="text-2xs text-muted-foreground mb-2 pl-4 line-clamp-2">{card.description}</p>
                  )}
                  <div className="flex items-center flex-wrap gap-1.5 pl-4 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${priorityColors[card.priority]}`}>
                      {card.priority}
                    </span>
                    {card.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
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

      {/* Full Feature Card Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  {modalMode === "create" ? "Add Kanban Card" : "Edit Card"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-surface-hover">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
                  <input
                    autoFocus
                    value={cardFormData.title || ""}
                    onChange={(e) => setCardFormData({ ...cardFormData, title: e.target.value })}
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="E.g. Database Migrations"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context / Description</label>
                  <textarea
                    value={cardFormData.description || ""}
                    onChange={(e) => setCardFormData({ ...cardFormData, description: e.target.value })}
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none min-h-[100px]"
                    placeholder="Provide additional details or markdown descriptions..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCardFormData({ ...cardFormData, priority: p })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-all border ${
                          cardFormData.priority === p 
                            ? (p === 'low' ? 'bg-muted border-muted-foreground/30 text-foreground' : p === 'medium' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-destructive/20 border-destructive/50 text-destructive')
                            : 'bg-transparent border-border text-muted-foreground hover:bg-surface-hover'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</label>
                  <div className="bg-surface border border-border rounded-md p-2 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                    {cardFormData.tags?.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-background border border-border text-foreground font-mono">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-destructive"><X size={10} /></button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Type and press enter..."
                      className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/50 bg-surface/50 mt-auto">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-transparent border border-border rounded-md hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCard}
                  disabled={!cardFormData.title?.trim()}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
