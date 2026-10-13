import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AuthModal from './components/common/AuthModal';
import { useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import MovieDetailPage from './pages/MovieDetailPage';
import VirtualRoomPage from './pages/VirtualRoomPage';
import UploadMoviePage from './pages/UploadMoviePage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import WatchHistoryPage from './pages/WatchHistoryPage';
import FriendsPage from './pages/FriendsPage';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMoviesPage from './pages/admin/AdminMoviesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUploadsPage from './pages/admin/AdminUploadsPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';

export default function App() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-red-600 selection:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<CatalogPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/room/:id" element={<VirtualRoomPage />} />
          <Route path="/upload" element={<UploadMoviePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<WatchHistoryPage />} />
          <Route path="/friends" element={<FriendsPage />} />

          {/* Admin Nested Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="rooms" element={<AdminRoomsPage />} />
            <Route path="uploads" element={<AdminUploadsPage />} />
          </Route>
        </Routes>
      </main>

      <Footer />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
