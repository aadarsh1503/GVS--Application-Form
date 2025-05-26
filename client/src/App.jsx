import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

import MultiStepForm from './components/MultiStepForm/MultiStepForm';
import Dashboard from './components/PersonalInfoStep/Dashboard/Dashboard';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';



const AppRoutes = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const content = (
    <Routes>
      <Route path="/" element={<MultiStepForm />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );

  return isHomePage ? (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {content}
    </div>
  ) : (
    content
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
