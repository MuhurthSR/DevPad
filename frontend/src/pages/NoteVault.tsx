import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Search, Maximize2, Minimize2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

const defaultNotes: Note[] = [
  {
    id: "1",
    title: "Architecture Overview",
    content: "# Architecture Overview\n\nOur system uses a **microservices** approach:\n\n- `api-gateway` — Routes & auth\n- `user-service` — Profiles & sessions\n- `data-pipeline` — ETL processing\n\n## TODO\n\n- [ ] Migrate to gRPC\n- [x] Add rate limiting\n- [ ] Implement circuit breaker",
    updatedAt: new Date("2026-03-14"),
  },
  {
    id: "2",
    title: "Sprint 14 Retro",
    content: "# Sprint 14 Retrospective\n\n## What went well\n- Shipped auth module on time\n- Zero P0 bugs\n\n## What to improve\n- Better async communication\n- More pair programming sessions",
    updatedAt: new Date("2026-03-13"),
  },
  {
    id: "3",
    title: "API Design Notes",
    content: "# REST API v3 Design\n\n```json\nGET /api/v3/projects/:id\nPOST /api/v3/projects\nPATCH /api/v3/projects/:id\n```\n\nUse **pagination** with cursor-based approach.\nMax page size: 100 items.",
    updatedAt: new Date("2026-03-12"),
  },
];

const NoteVault = () => {
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [selectedId, setSelectedId] = useState<string>("1");
  const [search, setSearch] = useState("");
  const [zenMode, setZenMode] = useState(false);

  const selected = notes.find((n) => n.id === selectedId);
  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "# Untitled Note\n\nStart writing...",
      updatedAt: new Date(),
    };
    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
  };

  const updateContent = (content: string) => {
    setNotes(
      notes.map((n) =>
        n.id === selectedId ? { ...n, content, updatedAt: new Date() } : n
      )
    );
  };

  const updateTitle = (title: string) => {
    setNotes(
      notes.map((n) =>
        n.id === selectedId ? { ...n, title, updatedAt: new Date() } : n
      )
    );
  };

  return (
    <div className="flex h-screen">
      {/* Note list */}
      {!zenMode && (
        <motion.div
          initial={{ width: 280, opacity: 1 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="w-[280px] shrink-0 border-r border-border flex flex-col bg-background"
        >
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Note Vault</h2>
              <button
                onClick={createNote}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vault..."
                className="w-full bg-surface rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-0.5">
            {filtered.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedId(note.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md transition-all ${
                  note.id === selectedId ? "active-state" : "hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">{note.title}</span>
                </div>
                <p className="text-2xs text-muted-foreground mt-0.5 pl-[22px] font-mono tabular-nums">
                  {note.updatedAt.toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 flex items-center justify-between px-4 border-b border-border">
          {selected && (
            <input
              value={selected.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="text-sm font-semibold text-foreground bg-transparent focus:outline-none tracking-tight"
            />
          )}
          <button
            onClick={() => setZenMode(!zenMode)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            title={zenMode ? "Exit Zen Mode" : "Zen Mode"}
          >
            {zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
        <div className="flex-1 overflow-auto flex justify-center">
          {selected && (
            <textarea
              value={selected.content}
              onChange={(e) => updateContent(e.target.value)}
              className="zen-editor w-full max-w-[680px] p-8 bg-transparent text-foreground focus:outline-none resize-none min-h-full"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteVault;
