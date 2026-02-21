import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Login from '../pages/Login/Login';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute />}>{/* Protected routes */}</Route>
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
