import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Lightbulb } from "lucide-react";

interface Idea {
  id: string;
  text: string;
  color: string;
}

const colors = [
  "hsl(var(--primary) / 0.15)",
  "hsl(270 70% 50% / 0.15)",
  "hsl(200 70% 50% / 0.15)",
  "hsl(30 70% 50% / 0.15)",
];

const defaultIdeas: Idea[] = [
  { id: "1", text: "Real-time collaboration with CRDTs", color: colors[0] },
  { id: "2", text: "AI-powered sprint planning", color: colors[1] },
  { id: "3", text: "Plugin marketplace for custom workflows", color: colors[2] },
  { id: "4", text: "Voice-to-note transcription", color: colors[3] },
  { id: "5", text: "Git-based version control for notes", color: colors[0] },
];

const Brainstorming = () => {
  const [ideas, setIdeas] = useState<Idea[]>(defaultIdeas);
  const [newIdea, setNewIdea] = useState("");
  const [canvas, setCanvas] = useState("# Brainstorm Canvas\n\nFree-form thinking space. Use markdown to structure your thoughts.\n\n## Key Questions\n\n- How do we improve onboarding?\n- What's the MVP for v3?\n- Where are the performance bottlenecks?\n\n## Decisions\n\n- [ ] Choose state management approach\n- [ ] Define API versioning strategy\n- [x] Settle on component library");

  const addIdea = () => {
    if (!newIdea.trim()) return;
    setIdeas([
      ...ideas,
      { id: Date.now().toString(), text: newIdea, color: colors[ideas.length % colors.length] },
    ]);
    setNewIdea("");
  };

  const removeIdea = (id: string) => {
    setIdeas(ideas.filter((i) => i.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Brainstorming</h1>
        <p className="text-xs text-muted-foreground mt-1">Capture ideas, explore possibilities.</p>
      </div>

      {/* Quick ideas */}
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
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ideas.map((idea) => (
            <motion.div
              key={idea.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => removeIdea(idea.id)}
              className="px-3 py-2 rounded-lg text-xs text-foreground cursor-pointer transition-shadow card-depth hover:card-depth-hover"
              style={{ backgroundColor: idea.color }}
            >
              {idea.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div>
        <span className="text-xs text-muted-foreground mb-3 block">Canvas</span>
        <textarea
          value={canvas}
          onChange={(e) => setCanvas(e.target.value)}
          className="zen-editor w-full min-h-[400px] bg-surface rounded-lg px-6 py-5 text-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default Brainstorming;
