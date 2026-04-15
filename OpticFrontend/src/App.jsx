import { useState, useEffect } from 'react';
import './App.css';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import UsersIndex from './components/users/UsersIndex';
import UserDelete from './components/users/UserDelete';
import PatientsIndex from './components/patients/PatientsIndex';
import PatientDelete from './components/patients/PatientDelete';
import PatientDetails from './components/patients/PatientDetails';
import ConsultationsIndex from './components/consultations/ConsultationsIndex';
import ConsultationDelete from './components/consultations/ConsultationDelete';
import ConsultationCreate from './components/consultations/ConsultationCreate';
import ConsultationEdit from './components/consultations/ConsultationEdit';
import GraduationCreate from './components/graduations/GraduationCreate';
import ConsultationGraduations from './components/graduations/ConsultationGraduations';
import SalesIndex from './components/sales/SalesIndex';
import SaleCreate from './components/sales/SaleCreate';
import PaymentManagement from './components/sales/PaymentManagement';
import SaleDelete from './components/sales/SaleDelete';
import PaymentDelete from './components/sales/PaymentDelete';
import SystemCustomization from './components/admin/SystemCustomization';
import AdminDashboard from './components/dashboard/AdminDashboard';
import SellerDashboard from './components/dashboard/SellerDashboard';
import useIdleTimeout from './hooks/useIdleTimeout';
import { authService } from './services/authService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [navigationParams, setNavigationParams] = useState({}); // Stores params like { userId: '123' }

  useEffect(() => {
    // Check if token exists on load using authService
    if (authService.isAuthenticated()) {
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
    authService.clearAuth();
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  // Initialize the idle timeout hook (60 minutes)
  useIdleTimeout(() => {
    if (isLoggedIn) {
      console.log('⏰ [Auth] Cierre de sesión por inactividad');
      handleLogout();
      // Silently log out without blocking the UI
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
            onNavigate={handleNavigate}
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
      case 'sales-create':
        return <SaleCreate onNavigate={handleNavigate} params={navigationParams} />;
      case 'sales-details':
        return <PaymentManagement onNavigate={handleNavigate} params={navigationParams} />;
      case 'sales':
        return <SalesIndex onNavigate={handleNavigate} params={navigationParams} />;
      case 'consultations':
        return <ConsultationsIndex onNavigate={handleNavigate} params={navigationParams} />;
      case 'consultation-create':
        return <ConsultationCreate onNavigate={handleNavigate} params={navigationParams} />;
      case 'consultation-edit':
        return <ConsultationEdit onNavigate={handleNavigate} params={navigationParams} />;
      case 'graduations-create':
        return <GraduationCreate onNavigate={handleNavigate} params={navigationParams} />;
      case 'consultation-graduations':
        return <ConsultationGraduations onNavigate={handleNavigate} params={navigationParams} />;
      case 'consultation-delete':
        return (
          <ConsultationDelete
            consultationId={navigationParams.consultationId}
            onBack={() =>
              navigationParams.patientId
                ? handleNavigate('patient-details', { patientId: navigationParams.patientId })
                : handleNavigate('consultations')
            }
            onSuccess={() =>
              navigationParams.patientId
                ? handleNavigate('patient-details', { patientId: navigationParams.patientId })
                : handleNavigate('consultations')
            }
          />
        );
      case 'sale-delete':
        return (
          <SaleDelete
            saleId={navigationParams.saleId}
            onBack={() => handleNavigate('patient-details', { patientId: navigationParams.patientId })}
            onSuccess={() => handleNavigate('patient-details', { patientId: navigationParams.patientId })}
          />
        );
      case 'payment-delete':
        return (
          <PaymentDelete
            saleId={navigationParams.saleId}
            paymentId={navigationParams.paymentId}
            onBack={() => handleNavigate('patient-details', { patientId: navigationParams.patientId })}
            onSuccess={() => handleNavigate('patient-details', { patientId: navigationParams.patientId })}
          />
        );
      case 'customization':
        return <SystemCustomization onNavigate={handleNavigate} />;
      case 'dashboard':
      default:
        {
          const roles = authService.getUserRoles();
          if (roles.includes('Root') || roles.includes('Admin')) {
            return <AdminDashboard onNavigate={handleNavigate} />;
          }
          return <SellerDashboard onNavigate={handleNavigate} />;
        }
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