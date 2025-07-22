import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// useState aur useEffect ki ab zaroorat nahi hai, to hata sakte hain
// import { useState, useEffect } from 'react';

import MultiStepForm from './components/MultiStepForm/MultiStepForm';
import Dashboard from './components/PersonalInfoStep/Dashboard/Dashboard';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import NotFound from './components/NotFound/NotFound'; // <-- 1. Import karein

const AppRoutes = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const content = (
    <Routes>
      <Route path="/" element={<MultiStepForm />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup-gvs3245" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
  
      <Route path="*" element={<NotFound />} />
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