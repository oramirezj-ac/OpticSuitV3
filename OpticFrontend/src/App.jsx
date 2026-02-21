import { useState, useEffect } from 'react';
import './App.css';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import UsersIndex from './components/users/UsersIndex';
import UserDelete from './components/users/UserDelete';
import PatientsIndex from './components/patients/PatientsIndex';
import PatientDelete from './components/patients/PatientDelete';
import PatientDetails from './components/patients/PatientDetails';
import HistoricalCapture from './components/historical/HistoricalCapture';
import SystemCustomization from './components/admin/SystemCustomization';
import useIdleTimeout from './hooks/useIdleTimeout';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [navigationParams, setNavigationParams] = useState({}); // Stores params like { userId: '123' }

  useEffect(() => {
    // Check if token exists on load using sessionStorage
    const token = sessionStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    console.log('👋 [Auth] Cerrando sesión...');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userSchema');
    sessionStorage.removeItem('userRoles');
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  // Initialize the idle timeout hook (60 minutes)
  useIdleTimeout(() => {
    if (isLoggedIn) {
      console.log('⏰ [Auth] Cierre de sesión por inactividad');
      handleLogout();
      alert('Tu sesión ha expirado por inactividad.');
    }
  }, 60);

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setNavigationParams(params);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'users':
        return <UsersIndex onNavigate={handleNavigate} />;
      case 'users-delete':
        return (
          <UserDelete
            userId={navigationParams.userId}
            userName={navigationParams.userName}
            onBack={() => handleNavigate('users')}
            onSuccess={() => handleNavigate('users')} // Vuelve a la lista tras borrar
          />
        );
      case 'patients':
        return <PatientsIndex onNavigate={handleNavigate} />;
      case 'patients-delete':
        return (
          <PatientDelete
            patientId={navigationParams.patientId}
            patientName={navigationParams.patientName}
            onBack={() => handleNavigate('patients')}
            onSuccess={() => handleNavigate('patients')}
          />
        );
      case 'patient-details':
        return (
          <PatientDetails
            patientId={navigationParams.patientId}
            onBack={() => handleNavigate('patients')}
            onNavigate={handleNavigate}
          />
        );
      case 'historical-capture':
        return <HistoricalCapture onNavigate={handleNavigate} />;
      case 'customization':
        return <SystemCustomization onNavigate={handleNavigate} />;
      case 'dashboard':
      default:
        return (
          <div>
            <h1>Dashboard</h1>
            <p>Bienvenido al sistema OpticSuit V3</p>
          </div>
        );
    }
  };

  if (checkingAuth) return null; // Or a loading spinner

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      onLogout={handleLogout}
      activePage={currentPage}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;