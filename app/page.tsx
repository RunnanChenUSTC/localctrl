"use client";
// Assuming this is in a file like App.tsx or a similar main component file

import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Home } from './components/home';
import LoginPage from '../pages/LoginPage';
import { getServerSideConfig } from './config/server';

const serverConfig = getServerSideConfig();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is logged in (this part remains unchanged)
    const token = localStorage.getItem('userToken');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <>
      {isAuthenticated ? (
        <Home />
      ) : (
        // Directly use LoginPage without dynamic import
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
      {serverConfig?.isVercel && <Analytics />}
    </>
  );
}
