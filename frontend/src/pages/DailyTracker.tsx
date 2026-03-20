import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, StickyNote } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const DailyTracker = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Review pull requests from team", completed: false },
    { id: "2", text: "Update API documentation", completed: true },
    { id: "3", text: "Ship v2.1 hotfix", completed: false },
    { id: "4", text: "Standup sync @ 10:00", completed: true },
  ]);
  const [newTodo, setNewTodo] = useState("");
  const [scratchpad, setScratchpad] = useState("// Quick thoughts...\n");

  const today = new Date();
  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodo, completed: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Daily Tracker
        </h1>
        <p className="text-xs text-muted-foreground font-mono tabular-nums mt-1">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Daily Progress</span>
          <span className="text-xs font-mono tabular-nums text-primary">
            {completedCount}/{todos.length} completed
          </span>
        </div>
        <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] }}
          />
        </div>
      </div>

      {/* Add todo */}
      <div className="flex gap-2 mb-6">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a task..."
          className="flex-1 bg-surface rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={addTodo}
          className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Todo list */}
      <div className="space-y-1.5 mb-8">
        <AnimatePresence>
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="group flex items-center gap-3 bg-surface rounded-md px-3 py-2.5 card-depth hover:card-depth-hover transition-shadow"
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30 hover:border-primary/50"
                }`}
              >
                {todo.completed && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="10" height="10" viewBox="0 0 10 10"
                  >
                    <path d="M2 5l2.5 2.5L8 3" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </motion.svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm transition-all duration-200 ${
                  todo.completed ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Scratchpad */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <StickyNote size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Scratchpad</span>
        </div>
        <textarea
          value={scratchpad}
          onChange={(e) => setScratchpad(e.target.value)}
          className="w-full h-32 bg-surface rounded-lg px-4 py-3 text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      </div>
    </div>
  );
};

export default DailyTracker;
