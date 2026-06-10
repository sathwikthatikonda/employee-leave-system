import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LeaveProvider } from './context/LeaveContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { EmployeePortal } from './pages/EmployeePortal';
import { ManagerPortal } from './pages/ManagerPortal';
import { HRPortal } from './pages/HRPortal';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');



  if (isLoading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loaderText}>Establishing Secure Connection...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'balance': return 'My Leave Balances';
      case 'request': return 'New Application';
      case 'approvals': return 'Review Applications';
      case 'calendar': return 'Team Schedule';
      case 'directory': return 'Employee Directory';
      case 'policy': return 'Global Policy Config';
      case 'analytics': return 'Analytics & Reporting';
      default: return 'Portal Console';
    }
  };

  return (
    <div className="app-layout">
      {/* Navigation and Top Header */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="app-content">
        <Header title={getPageTitle()} />
        
        {/* Dynamic portal display */}
        {user.role === 'Employee' && <EmployeePortal activeTab={activeTab} setActiveTab={setActiveTab} />}
        {user.role === 'Manager' && <ManagerPortal activeTab={activeTab} setActiveTab={setActiveTab} />}
        {user.role === 'HR' && <HRPortal activeTab={activeTab} setActiveTab={setActiveTab} />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LeaveProvider>
        <AppContent />
      </LeaveProvider>
    </AuthProvider>
  );
};

export default App;

const styles: Record<string, React.CSSProperties> = {
  loaderContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F8FAFC',
    color: '#0F172A',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#4F46E5', // theme accent
    animation: 'spin 1s linear infinite'
  },
  loaderText: {
    fontSize: '0.9rem',
    color: '#475569',
    letterSpacing: '0.01em',
    fontWeight: 500
  }
};

// Add standard keyframe rule directly for spinner anim
const styleSheet = document.styleSheets[0] || document.head.appendChild(document.createElement('style')).sheet;
try {
  styleSheet.insertRule(`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);
} catch {
  // stylesheet insert error ignored
}
