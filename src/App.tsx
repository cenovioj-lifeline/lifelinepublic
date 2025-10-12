import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./lib/auth";
import AdminAuth from "./pages/admin/AdminAuth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/AdminLayout";
import { PublicLayout } from "./components/PublicLayout";
import Collections from "./pages/Collections";
import CollectionEdit from "./pages/CollectionEdit";
import Lifelines from "./pages/Lifelines";
import Profiles from "./pages/Profiles";
import Elections from "./pages/Elections";
import Tags from "./pages/Tags";
import Media from "./pages/Media";
import LifelineEdit from "./pages/LifelineEdit";
import ElectionEdit from "./pages/ElectionEdit";
import ElectionCategoryOrder from "./pages/ElectionCategoryOrder";
import ProfileEdit from "./pages/ProfileEdit";
import TagEdit from "./pages/TagEdit";
import MediaEdit from "./pages/MediaEdit";
import Home from "./pages/public/Home";
import PublicLifelines from "./pages/public/PublicLifelines";
import PublicLifelineDetail from "./pages/public/PublicLifelineDetail";
import PublicCollections from "./pages/public/PublicCollections";
import PublicCollectionDetail from "./pages/public/PublicCollectionDetail";
import CollectionFeed from "./pages/public/CollectionFeed";
import CollectionLifelines from "./pages/public/CollectionLifelines";
import CollectionProfiles from "./pages/public/CollectionProfiles";
import CollectionElections from "./pages/public/CollectionElections";
import PublicProfiles from "./pages/public/PublicProfiles";
import PublicProfileDetail from "./pages/public/PublicProfileDetail";
import PublicElections from "./pages/public/PublicElections";
import PublicElectionDetail from "./pages/public/PublicElectionDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminAuth />} />
            
            {/* Public Routes */}
            <Route path="/home" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/public/lifelines" element={<PublicLayout><PublicLifelines /></PublicLayout>} />
          <Route path="/public/lifelines/:slug" element={<PublicLayout><PublicLifelineDetail /></PublicLayout>} />
            <Route path="/public/collections" element={<PublicLayout><PublicCollections /></PublicLayout>} />
            <Route path="/public/collections/:slug" element={<PublicCollectionDetail />} />
            <Route path="/public/collections/:slug/feed" element={<CollectionFeed />} />
            <Route path="/public/collections/:slug/lifelines" element={<CollectionLifelines />} />
            <Route path="/public/collections/:slug/profiles" element={<CollectionProfiles />} />
            <Route path="/public/collections/:slug/elections" element={<CollectionElections />} />
            <Route path="/public/profiles" element={<PublicLayout><PublicProfiles /></PublicLayout>} />
          <Route path="/public/elections" element={<PublicLayout><PublicElections /></PublicLayout>} />
          <Route path="/public/elections/:slug" element={<PublicLayout><PublicElectionDetail /></PublicLayout>} />
          <Route path="/public/profiles/:slug" element={<PublicLayout><PublicProfileDetail /></PublicLayout>} />
            
            {/* Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Collections />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <CollectionEdit />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lifelines"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Lifelines />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lifelines/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <LifelineEdit />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profiles"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Profiles />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profiles/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ProfileEdit />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Elections />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ElectionEdit />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections-category-order"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ElectionCategoryOrder />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tags"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Tags />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tags/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <TagEdit />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/media"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Media />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/media/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <MediaEdit />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
