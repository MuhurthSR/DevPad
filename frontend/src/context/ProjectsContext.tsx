import React, { createContext, useContext, useState, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";

export interface Idea {
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

export const defaultIdeas: Idea[] = [
  { id: "1", text: "Real-time collaboration with CRDTs", color: colors[0] },
  { id: "2", text: "AI-powered sprint planning", color: colors[1] },
  { id: "3", text: "Plugin marketplace for custom workflows", color: colors[2] },
  { id: "4", text: "Voice-to-note transcription", color: colors[3] },
  { id: "5", text: "Git-based version control for notes", color: colors[0] },
];

interface ProjectsContextState {
  ideas: Idea[];
  addIdea: (text: string) => Idea;
  removeIdea: (id: string) => void;
  
  activeProjectIds: string[];
  openProject: (id: string) => void;
  closeProject: (id: string) => void;
  reorderProjects: (oldIndex: number, newIndex: number) => void;
}

const ProjectsContext = createContext<ProjectsContextState | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ideas, setIdeas] = useState<Idea[]>(defaultIdeas);
  // Default to having the first two ideas opened as "Projects" for demonstration
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>(["1", "2"]);

  const addIdea = (text: string) => {
    const newIdea = { 
      id: Date.now().toString(), 
      text, 
      color: colors[ideas.length % colors.length] 
    };
    setIdeas((prev) => [...prev, newIdea]);
    return newIdea;
  };

  const removeIdea = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    setActiveProjectIds((prev) => prev.filter(pid => pid !== id));
  };

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
        ideas,
        addIdea,
        removeIdea,
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
