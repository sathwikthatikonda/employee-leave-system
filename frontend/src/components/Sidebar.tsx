import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard,
  Calendar, 
  LogOut, 
  Users, 
  Sliders, 
  FileText, 
  PlusCircle, 
  Activity,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItemProps {
  id: string;
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  label: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon: Icon, label, activeTab, setActiveTab }) => {
  const isActive = activeTab === id;
  return (
    <button 
      onClick={() => setActiveTab(id)} 
      style={{ 
        ...styles.navLink, 
        ...(isActive ? styles.navLinkActive : {}),
        ...(isActive ? { color: 'var(--theme-accent)', background: '#EEF2FF', fontWeight: 600 } : {})
      }}
    >
      <Icon size={18} color={isActive ? 'var(--theme-accent)' : 'var(--text-secondary)'} />
      <span>{label}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleColor = () => {
    switch (user.role) {
      case 'Manager': return 'var(--color-manager)';
      case 'HR': return 'var(--color-hr)';
      default: return 'var(--color-employee)';
    }
  };

  const getRoleBgColor = () => {
    switch (user.role) {
      case 'Manager': return '#F5F3FF'; // Violet 50
      case 'HR': return '#ECFDF5';      // Emerald 50
      default: return '#EFF6FF';        // Blue 50
    }
  };

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoIcon}>
          <div style={{width: 14, height: 14, background: 'var(--theme-accent)', borderRadius: 3}} />
          <div style={{width: 14, height: 14, background: 'var(--text-primary)', borderRadius: 3}} />
        </div>
        <div>
          <h2 style={styles.brandTitle}>Chronos</h2>
          <span style={styles.brandSub}>Workspace Portal</span>
        </div>
      </div>

      {/* User info panel */}
      <div style={styles.userPanel}>
        <div style={{ ...styles.avatar, backgroundColor: getRoleBgColor(), color: getRoleColor() }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
            {user.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div style={styles.userInfo}>
          <h4 style={styles.userName}>{user.name}</h4>
          <span style={styles.roleBadge}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Navigation menu */}
      <nav style={styles.navMenu}>
        <div style={styles.sectionTitle}>Main Menu</div>
        
        {/* Dashboard available to all */}
        <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Employee links */}
        {user.role === 'Employee' && (
          <>
            <NavItem id="request" icon={PlusCircle} label="Apply for Leave" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="balance" icon={Activity} label="Leave Balances" activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        )}

        {/* Manager links */}
        {user.role === 'Manager' && (
          <>
            <NavItem id="approvals" icon={FileText} label="Pending Approvals" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="calendar" icon={Calendar} label="Team Calendar" activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        )}

        {/* HR links */}
        {user.role === 'HR' && (
          <>
            <NavItem id="directory" icon={Users} label="Employee Directory" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="policy" icon={Sliders} label="Global Policies" activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        )}

        {/* Analytics available to all roles */}
        <NavItem id="analytics" icon={BarChart3} label="Analytics" activeTab={activeTab} setActiveTab={setActiveTab} />
      </nav>

      {/* Log out footer */}
      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    background: '#FFFFFF',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
    zIndex: 100
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    padding: '0 8px'
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1
  },
  brandSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  userPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    background: '#F8FAFC',
    border: '1px solid var(--border-color)',
    marginBottom: '32px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden'
  },
  userName: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },
  roleBadge: {
    fontSize: '0.7rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    alignSelf: 'flex-start'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1
  },
  sectionTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    marginTop: '8px',
    fontWeight: 600,
    paddingLeft: '12px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    fontWeight: 500
  },
  navLinkActive: {
    // Styles applied conditionally above
  },
  footer: {
    paddingTop: '16px'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    transition: 'background 0.2s ease, color 0.2s ease'
  }
};
