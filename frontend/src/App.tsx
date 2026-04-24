import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import DailyTracker from "./pages/DailyTracker";
import NoteVault from "./pages/NoteVault";
import Brainstorming from "./pages/Brainstorming";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import {ProtectedRoute} from "./components/ProtectedRoute.js";
import { ProjectsProvider } from "./context/ProjectsContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />  
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ProjectsProvider>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<DailyTracker />} />
                      <Route path="/notes" element={<NoteVault />} />
                      <Route path="/brainstorm" element={<Brainstorming />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/:id" element={<Projects />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProjectsProvider>
              </ProtectedRoute>
              
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
