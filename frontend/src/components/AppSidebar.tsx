import React, { useState, useEffect } from "react";
import { CalendarDays, FileText, Lightbulb, PanelLeftClose, PanelLeft, LogOut, User, FolderKanban, GripVertical, X, Terminal } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const coreNavItems = [
  { title: "Daily Tracker", url: "/", icon: CalendarDays },
  { title: "Note Vault", url: "/notes", icon: FileText },
  { title: "Brainstorming", url: "/brainstorm", icon: Lightbulb },
  { title: "Projects Hub", url: "/projects", icon: FolderKanban },
];

const transition = { type: "tween" as const, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number], duration: 0.2 };

const getUsernameFromToken = (): string => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "User";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? "User";
  } catch {
    return "User";
  }
};

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Wrapper to mimic NavLink styles but allows for sorting
const SortableSidebarProject = ({ id, idea, collapsed, onClose }: { id: string, idea: any, collapsed: boolean, onClose: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: dndTransition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: dndTransition,
    zIndex: isDragging ? 50 : 1,
  };

  const location = useLocation();
  const isActive = location.pathname === `/projects/${id}`;

  return (
    <div ref={setNodeRef} style={style} className={`relative group flex items-center mb-0.5 ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <div 
        {...attributes}
        {...listeners}
        className={`absolute left-0 top-0 bottom-0 flex items-center justify-center w-6 cursor-grab active:cursor-grabbing z-10 transition-opacity ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <GripVertical size={13} className="text-muted-foreground" />
      </div>
      
      <RouterNavLink
        to={`/projects/${id}`}
        className={`flex-1 flex items-center gap-3 py-2 rounded-md transition-all text-xs outline-none ${collapsed ? 'px-2.5' : 'pl-6 pr-2.5'}
          ${isActive ? 'bg-white/5 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' : 'text-sidebar-foreground hover:bg-surface-hover hover:text-foreground'}`}
      >
        <div className="shrink-0 w-[18px] flex items-center justify-center">
          <span 
            className="w-2.5 h-2.5 rounded-full block border border-background/20" 
            style={{ backgroundColor: idea.color.includes("/") ? idea.color.replace("/ 0.15)", "/ 1)") : idea.color }}
          />
        </div>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={transition}
              className="whitespace-nowrap overflow-hidden flex-1 truncate"
            >
              {idea.text}
            </motion.span>
          )}
        </AnimatePresence>
      </RouterNavLink>

      {!collapsed && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          className="absolute right-2 top-0 bottom-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-muted-foreground hover:text-foreground z-10 transition-opacity"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const username = getUsernameFromToken();
  const location = useLocation();

  // Resize Logic
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isResizing]);

  const { ideas, activeProjectIds, reorderProjects, closeProject } = useProjects();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2, // Slight distance before grab so clicks register
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activeProjectIds.indexOf(active.id as string);
      const newIndex = activeProjectIds.indexOf(over.id as string);
      reorderProjects(oldIndex, newIndex);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : sidebarWidth }}
      transition={isResizing ? { duration: 0 } : transition}
      className={`relative h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 z-40 ${isResizing ? '' : 'transition-all duration-200'}`}
    >
      {/* Resizer Handle */}
      {!collapsed && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className={`absolute top-0 right-[-2px] w-2 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50 ${
            isResizing ? "bg-primary" : ""
          }`}
        />
      )}

      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={transition}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-inner">
                <Terminal size={14} className="text-primary-foreground stroke-[2.5]" />
              </div>
              <span className="font-bold tracking-tight text-lg ml-0.5 mt-[1px]">
                <span className="text-foreground">Dev</span>
                <span className="text-primary">Pad</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        
        {/* Core items */}
        <div className="space-y-0.5">
          {coreNavItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <RouterNavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-md text-xs transition-all outline-none
                  ${isActive ? 'bg-white/5 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' : 'text-sidebar-foreground hover:bg-surface-hover hover:text-foreground'}`}
              >
                <item.icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={transition}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </RouterNavLink>
            )
          })}
        </div>

        {/* Dynamic Canvas Projects */}
        <div className="pt-2 border-t border-sidebar-border">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 pb-2 text-2xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Projects
              </motion.div>
            )}
          </AnimatePresence>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-0 text-sm">
              <SortableContext items={activeProjectIds} strategy={verticalListSortingStrategy}>
                {activeProjectIds.map(id => {
                  const idea = ideas.find(i => i.id === id);
                  if (!idea) return null;
                  return (
                    <SortableSidebarProject 
                      key={id} 
                      id={id} 
                      idea={idea} 
                      collapsed={collapsed} 
                      onClose={() => closeProject(id)}
                    />
                  );
                })}
              </SortableContext>
            </div>
          </DndContext>
          
          {activeProjectIds.length === 0 && !collapsed && (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">
              No open projects.
            </div>
          )}
        </div>
      </nav>

      {/* Profile + Logout */}
      <div className="relative px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sidebar-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <User size={12} className="text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={transition}
                className="text-xs font-medium whitespace-nowrap overflow-hidden"
              >
                {username}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Dropdown — opens upward */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute bottom-full left-2 mb-1 bg-card border border-border rounded-lg card-depth overflow-hidden z-50`}
              style={{ width: collapsed ? 200 : sidebarWidth - 16 }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
