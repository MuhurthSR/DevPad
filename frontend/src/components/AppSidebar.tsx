import { CalendarDays, FileText, Lightbulb, FolderKanban, PanelLeftClose, PanelLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Daily Tracker", url: "/", icon: CalendarDays },
  { title: "Note Vault", url: "/notes", icon: FileText },
  { title: "Brainstorming", url: "/brainstorm", icon: Lightbulb },
  { title: "Projects", url: "/projects", icon: FolderKanban },
];

const transition = { type: "tween" as const, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number], duration: 0.2 };

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={transition}
      className="h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
    >
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
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">D</span>
              </div>
              <span className="font-semibold text-foreground tracking-tight text-sm">DevPad</span>
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

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-2.5 py-2 rounded-md text-xs text-sidebar-foreground hover:bg-surface-hover hover:text-foreground transition-all"
            activeClassName="active-state"
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
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="text-2xs text-muted-foreground font-mono tabular-nums"
            >
              v1.0.0 — DevPad
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
