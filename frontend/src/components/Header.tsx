import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Clock, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, tokenExpiresIn } = useAuth();

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
      case 'Manager': return '#F5F3FF';
      case 'HR': return '#ECFDF5';
      default: return '#EFF6FF';
    }
  };

  // Format seconds into mm:ss
  const formatTimeLeft = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isExpiring = tokenExpiresIn !== null && tokenExpiresIn < 300; // < 5 min

  return (
    <header style={styles.header}>
      {/* Title */}
      <div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>Welcome back, {user.name.split(' ')[0]}</p>
      </div>

      {/* Action panel */}
      <div style={styles.actions}>
        
        {/* Search Bar */}
        <div style={styles.searchBar}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search..." 
            style={styles.searchInput}
          />
        </div>

        {/* Token Expiry Timer */}
        <div style={{
          ...styles.tokenBadge,
          borderColor: isExpiring ? '#FECACA' : 'var(--border-color)',
          color: isExpiring ? '#DC2626' : 'var(--text-secondary)',
          background: isExpiring ? '#FEF2F2' : '#FFFFFF'
        }}>
          <Clock size={14} color={isExpiring ? '#DC2626' : 'var(--text-secondary)'} />
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {formatTimeLeft(tokenExpiresIn)}
          </span>
        </div>

        {/* Notifications */}
        <button style={styles.iconBtn} aria-label="Notifications">
          <div style={styles.badgeIndicator} />
          <Bell size={18} color="var(--text-secondary)" />
        </button>

        {/* User profile */}
        <div style={styles.profileBtn}>
          <div style={styles.profileInfo}>
            <span style={styles.profileName}>{user.name}</span>
            <span style={styles.profileEmail}>{user.role}</span>
          </div>
          <div style={{ ...styles.avatar, backgroundColor: getRoleBgColor(), color: getRoleColor() }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 'var(--header-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    background: 'transparent',
    marginBottom: '24px'
  },
  title: {
    fontSize: '1.5rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '4px'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#FFFFFF',
    border: '1px solid var(--border-color)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    width: '240px',
    boxShadow: 'var(--shadow-sm)'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
    fontSize: '0.85rem',
    color: 'var(--text-primary)'
  },
  tokenBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid var(--border-color)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-sm)'
  },
  iconBtn: {
    background: '#FFFFFF',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    boxShadow: 'var(--shadow-sm)'
  },
  badgeIndicator: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--color-error)'
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    paddingLeft: '8px',
    borderLeft: '1px solid var(--border-color)'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'right'
  },
  profileName: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: '600'
  },
  profileEmail: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  }
};
