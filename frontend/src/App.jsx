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
import VerifyEmail from './pages/auth/VerifyEmail';
import GoogleCallback from './pages/auth/GoogleCallback';

// Protected Pages
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import Recommendations from './pages/Recommendations';
import MealPlan from './pages/MealPlan';
import WeightLog from './pages/WeightLog';
import Workouts from './pages/Workouts';
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
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />


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
                <Route path="tracker" element={<FoodLog />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="meal-plan" element={<MealPlan />} />
                <Route path="weight" element={<WeightLog />} />
                <Route path="workouts" element={<Workouts />} />
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
