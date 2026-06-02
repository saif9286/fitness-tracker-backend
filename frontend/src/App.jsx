import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

// Components & Layouts
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Protected Pages
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import FoodTracker from './pages/FoodTracker';
import Recommendations from './pages/Recommendations';
import MealPlan from './pages/MealPlan';
import WeightTracker from './pages/WeightTracker';
import WorkoutTracker from './pages/WorkoutTracker';
import ProgressPhotos from './pages/ProgressPhotos';
import Profile from './pages/Profile';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Onboarding Wizard (requires auth but doesn't require profile) */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Main App Routes (Protected and requires completed profile) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="tracker" element={<FoodTracker />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="meal-plan" element={<MealPlan />} />
                <Route path="weight" element={<WeightTracker />} />
                <Route path="workouts" element={<WorkoutTracker />} />
                <Route path="progress" element={<ProgressPhotos />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
