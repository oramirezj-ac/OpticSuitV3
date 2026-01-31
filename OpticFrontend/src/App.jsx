import { useState, useEffect } from 'react';
import './App.css';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    console.log('👋 [Auth] Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userSchema');
    setIsLoggedIn(false);
  };

  if (checkingAuth) return null; // Or a loading spinner

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Layout onLogout={handleLogout} />;
}

export default App;