import { useState } from "react";
import { CalendarDays, FileText, Lightbulb, FolderKanban, PanelLeftClose, PanelLeft, LogOut, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const navItems = [
  { title: "Daily Tracker", url: "/", icon: CalendarDays },
  { title: "Note Vault", url: "/notes", icon: FileText },
  { title: "Brainstorming", url: "/brainstorm", icon: Lightbulb },
  { title: "Projects", url: "/projects", icon: FolderKanban },
];

const transition = { type: "tween" as const, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number], duration: 0.2 };

// Decode username from JWT payload without any library
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

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const username = getUsernameFromToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={transition}
      className="h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
    >
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

      {/* Nav */}
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
              className="absolute bottom-full left-2 right-2 mb-1 bg-card border border-border rounded-lg card-depth overflow-hidden z-50"
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
