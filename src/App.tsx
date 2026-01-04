import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./lib/auth";
import { useGlobalColors } from "@/hooks/useGlobalColors";
import AdminAuth from "./pages/admin/AdminAuth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/AdminLayout";
import { PublicLayout } from "./components/PublicLayout";
import { CollectionLayout } from "./components/CollectionLayout";
import Collections from "./pages/Collections";
import CollectionEdit from "./pages/CollectionEdit";
import Lifelines from "./pages/Lifelines";
import Profiles from "./pages/Profiles";
import Books from "./pages/Books";
import BookEdit from "./pages/BookEdit";
import Elections from "./pages/Elections";
import Tags from "./pages/Tags";
import LifelineEdit from "./pages/LifelineEdit";
import ElectionEdit from "./pages/ElectionEdit";
import ElectionCategoryOrder from "./pages/ElectionCategoryOrder";
import ProfileEdit from "./pages/ProfileEdit";
import TagEdit from "./pages/TagEdit";
import Settings from "./pages/Settings";
import LifelineColorEditor from "./pages/LifelineColorEditor";
import LoadLifelines from "./pages/LoadLifelines";
import Home from "./pages/public/Home";
import HomePrototype from "./pages/public/HomePrototype";
import ProfilePrototype from "./pages/public/ProfilePrototype";
import PublicLifelines from "./pages/public/PublicLifelines";
import PublicLifelineDetail from "./pages/public/PublicLifelineDetail";
import PublicCollections from "./pages/public/PublicCollections";
import PublicCollectionDetail from "./pages/public/PublicCollectionDetail";
import CollectionFeed from "./pages/public/CollectionFeed";
import CollectionLifelines from "./pages/public/CollectionLifelines";
import CollectionProfiles from "./pages/public/CollectionProfiles";
import CollectionElections from "./pages/public/CollectionElections";
import CollectionSettings from "./pages/public/CollectionSettings";
import CollectionMedia from "./pages/public/CollectionMedia";
import PublicProfiles from "./pages/public/PublicProfiles";
import PublicProfileDetail from "./pages/public/PublicProfileDetail";
import BookDetailPage from "./pages/public/BookDetailPage";
import PublicElections from "./pages/public/PublicElections";
import PublicElectionDetail from "./pages/public/PublicElectionDetail";
import CollectionLifelineDetail from "./pages/public/CollectionLifelineDetail";
import CollectionProfileDetail from "./pages/public/CollectionProfileDetail";
import CollectionElectionDetail from "./pages/public/CollectionElectionDetail";
import FanContributions from "./pages/FanContributions";
import UserProfile from "./pages/public/UserProfile";
import TopContributors from "./pages/public/TopContributors";
import PublicMore from "./pages/public/PublicMore";
import CollectionMore from "./pages/public/CollectionMore";
import CollectionQuotes from "./pages/public/CollectionQuotes";
import CollectionMembers from "./pages/public/CollectionMembers";
import CollectionClaim from "./pages/public/CollectionClaim";
import HomeManager from "./pages/HomeManager";
import PublicLifelinesGrid from "./pages/public/PublicLifelinesGrid";
import PublicCollectionsGrid from "./pages/public/PublicCollectionsGrid";
import UserRequests from "./pages/UserRequests";
import ColorSchemes from "./pages/ColorSchemes";
import ColorSchemeEdit from "./pages/ColorSchemeEdit";
import TestImageImport from "./pages/TestImageImport";
import ImportNewsImages from "./pages/ImportNewsImages";
import LifelineImageManager from "./pages/LifelineImageManager";
import Feed from "./pages/public/Feed";
import FeedSetup from "./pages/public/FeedSetup";
import CollectionReport from "./pages/CollectionReport";

const queryClient = new QueryClient();

function AppContent() {
  useGlobalColors(); // Apply global colors
  
  return (
    <BrowserRouter>
          <Routes>
            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminAuth />} />
            
            {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/prototype/home" element={<PublicLayout><HomePrototype /></PublicLayout>} />
                <Route 
                  path="/prototype/profile" 
                  element={
                    <CollectionLayout 
                      collectionTitle="Prof G Media" 
                      collectionSlug="prof-g-media" 
                      collectionId="357ef542-1127-45e2-9174-841f85be6499"
                    >
                      <ProfilePrototype />
                    </CollectionLayout>
                  } 
                />
          <Route path="/public/lifelines" element={<PublicLayout><PublicLifelinesGrid /></PublicLayout>} />
          <Route path="/public/lifelines/:slug" element={<PublicLifelineDetail />} />
          <Route path="/public/collections" element={<PublicLayout><PublicCollections /></PublicLayout>} />
          <Route path="/public/collections/all" element={<Navigate to="/public/collections" replace />} />
          <Route path="/public/collections/:slug" element={<PublicCollectionDetail />} />
          <Route path="/public/collections/:slug/feed" element={<CollectionFeed />} />
          <Route path="/public/collections/:slug/settings" element={<CollectionSettings />} />
          <Route path="/public/collections/:slug/media" element={<CollectionMedia />} />
            <Route path="/public/collections/:slug/lifelines" element={<CollectionLifelines />} />
            <Route path="/public/collections/:collectionSlug/lifelines/:lifelineSlug" element={<CollectionLifelineDetail />} />
          <Route path="/public/collections/:slug/profiles" element={<CollectionProfiles />} />
            <Route path="/public/collections/:collectionSlug/profiles/:profileSlug" element={<CollectionProfileDetail />} />
            <Route path="/public/collections/:slug/elections" element={<CollectionElections />} />
            <Route path="/public/collections/:collectionSlug/elections/:electionSlug" element={<CollectionElectionDetail />} />
            <Route path="/public/collections/:slug/contributors" element={<TopContributors />} />
            <Route path="/public/collections/:slug/quotes" element={<CollectionQuotes />} />
            <Route path="/public/collections/:slug/members" element={<CollectionMembers />} />
            <Route path="/public/collections/:slug/claim" element={<CollectionClaim />} />
          <Route path="/public/profiles" element={<PublicLayout><PublicProfiles /></PublicLayout>} />
          <Route path="/public/elections" element={<PublicLayout><PublicElections /></PublicLayout>} />
          <Route path="/public/elections/:slug" element={<PublicElectionDetail />} />
          <Route path="/public/profiles/:slug" element={<PublicProfileDetail />} />
          {/* Book Detail Routes */}
          <Route path="/public/profiles/:profileSlug/books/:bookSlug" element={<BookDetailPage />} />
          <Route path="/public/collections/:collectionSlug/profiles/:profileSlug/books/:bookSlug" element={<BookDetailPage />} />
          <Route path="/profile" element={<PublicLayout><UserProfile /></PublicLayout>} />
          <Route path="/top-contributors" element={<PublicLayout><TopContributors /></PublicLayout>} />
          <Route path="/public/more" element={<PublicLayout><PublicMore /></PublicLayout>} />
          <Route path="/public/collections/:slug/more" element={<CollectionMore />} />
          <Route path="/public/contributors" element={<PublicLayout><TopContributors /></PublicLayout>} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/feed/setup" element={<PublicLayout><FeedSetup /></PublicLayout>} />
          <Route path="/auth" element={<AdminAuth />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
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
              path="/collection-report"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <CollectionReport />
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
              path="/books"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Books />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BookEdit />
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
              path="/settings"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/lifeline-colors"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <LifelineColorEditor />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/load-lifelines"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <LoadLifelines />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/home-manager"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <HomeManager />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fan-contributions"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <FanContributions />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-requests"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <UserRequests />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/color-schemes"
              element={
                <ProtectedRoute>
                  <ColorSchemes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/color-schemes/:id"
              element={
                <ProtectedRoute>
                  <ColorSchemeEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-image-import"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <TestImageImport />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/import-news-images"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ImportNewsImages />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lifeline-image-manager"
              element={
                <ProtectedRoute>
                  <LifelineImageManager />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
