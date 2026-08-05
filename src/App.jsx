

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import HomePage from './components/HomePage';
import AdminDashboard from './components/admin/AdminDashboard';
import DashboardVendeur from './components/Dashboard/dashboard';
import SellerSignup from './components/admin/SellerSignup';
import DriverSignup from './components/Signup/DriverSignup';
import Login from './components/login/Login';
import ProtectedRoute from './components/ProtectedRoute';



function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />

      <Route element={<ProtectedRoute  />}>
        <Route path="/dashboard/*" element={<DashboardVendeur />} />
      </Route>
      <Route path="/unauthorized" element={<h1>403 - Accès non autorisé</h1>} />

        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/inscription-vendeur" element={<SellerSignup />} />
        <Route path="/inscription-livreur" element={<DriverSignup />} />
      </Routes>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // Vert pour le succès
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // Rouge pour l'erreur
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>

    
  );
}

export default App;