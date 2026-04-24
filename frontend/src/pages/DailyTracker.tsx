import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, StickyNote } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  logId: string;
}

const DailyTracker = () => {
  const queryClient = useQueryClient();

  const {data,isLoading} = useQuery({
    queryKey : ["daily-tasks"],
    queryFn : () => api.get("/api/logs/today/tasks")
  });

  const todos: Todo[] = (data?.tasks ?? []).map((t: any) => ({
    id: t.task_id,
    text: t.task,
    completed: t.is_completed,
    logId: t.log_id,
  }));

  useEffect(()=>{
    if(data?.tasks?.[0]?.scratchpad !==undefined){
      setScratchpad(data.tasks[0].scratchpad ?? "");
    }
  },[data]);

  const [newTodo, setNewTodo] = useState("");
  const [scratchpad, setScratchpad] = useState("");

  const today = new Date();
  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  const addMutation = useMutation({
    mutationFn : (text : string) => 
      api.post("/api/logs/today/tasks",{task :text}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey:["daily-tasks"]});
      setNewTodo("");
    }
  });

  const addTodo = () =>{
    if(!newTodo.trim()) return;
    addMutation.mutate(newTodo);
  }

  const toggleMutation = useMutation({
    mutationFn : ({taskId,logId,completed} : {taskId : string,logId : string,completed : boolean}) =>
      api.patch(`/api/logs/${logId}/tasks/${taskId}`,{is_completed : completed}),
    onSuccess : () => {
      queryClient.invalidateQueries({queryKey : ["daily-tasks"]});
    }
  });

  const toggleTodo = (id : string) => {
    const todo = todos.find((t) => t.id === id);
    if(todo){
      toggleMutation.mutate({taskId : id, logId : todo.logId, completed : !todo.completed});
    }
  }

  const deleteMutation = useMutation({
  mutationFn: ({ taskId, logId }: { taskId: string; logId: string }) =>
    api.delete(`/api/logs/${logId}/tasks/${taskId}`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["daily-tasks"] });
  },
});

const deleteTodo = (id: string) => {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    deleteMutation.mutate({ taskId: id, logId: todo.logId });
  }
};

const scratchpadMutation = useMutation({
  mutationFn : ({scratchpad} : {scratchpad : string}) =>
    api.patch(`/api/logs/today/scratchpad`,{scratchpad})
})

const debounceTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

const handelScratchpadChange = (e : React.ChangeEvent<HTMLTextAreaElement>) =>  {
  const value = e.target.value;

  setScratchpad(value);

  if(debounceTimer.current){
    clearTimeout(debounceTimer.current);
  }

  debounceTimer.current = setTimeout(()=>{
    scratchpadMutation.mutate({scratchpad:value});
  },1000)
}

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Daily Tracker</h1>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface rounded-md card-depth animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
          onChange={handelScratchpadChange}
          placeholder="Quick thoughts..."
          className="w-full h-32 bg-surface rounded-lg px-4 py-3 text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      </div>
    </div>
  );
};

export default DailyTracker;
