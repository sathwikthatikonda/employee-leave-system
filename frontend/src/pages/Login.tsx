import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import { Calendar, User, ShieldAlert, Award, Lock, Mail, Key, ArrowLeft, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [errorMsg, setErrorMsg] = useState('');
  
  // OTP Flow States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Resend countdown timer logic
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    const root = document.documentElement;
    if (selectedRole === 'Employee') {
      root.style.setProperty('--theme-accent', '#3B82F6');
      root.style.setProperty('--theme-accent-rgb', '59, 130, 246');
    } else if (selectedRole === 'Manager') {
      root.style.setProperty('--theme-accent', '#8B5CF6');
      root.style.setProperty('--theme-accent-rgb', '139, 92, 246');
    } else {
      root.style.setProperty('--theme-accent', '#10B981');
      root.style.setProperty('--theme-accent-rgb', '16, 185, 129');
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsVerifying(true);
    try {
      if (API_BASE_URL.includes('your-api-id')) {
        throw new Error('PLACEHOLDER_URL');
      }

      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role,
        }),
      });

      const data = await response.json();
      setIsVerifying(false);

      if (response.ok) {
        setIsOtpSent(true);
        setResendTimer(60);
        setCopied(false);
        if (data.devModeOtp) {
          setOtpCode(data.devModeOtp);
          setShowToast(true);
        } else {
          setShowToast(false);
        }
      } else {
        setErrorMsg(data.message || 'Could not send verification code.');
      }
    } catch (error: unknown) {
      setIsVerifying(false);
      const isPlaceholder = error instanceof Error && error.message === 'PLACEHOLDER_URL';
      if (isPlaceholder || error instanceof TypeError) {
        console.warn('AWS API Gateway not configured or unreachable. Falling back to local sandbox auth.');
        // Local sandbox fallback
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpCode(generatedCode);
        setIsOtpSent(true);
        setResendTimer(60);
        setCopied(false);
        setShowToast(true);
      } else {
        console.error('Connection failed:', error);
        setErrorMsg('Failed to connect to the authentication server.');
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrorMsg('');
    setEnteredOtp('');
    
    try {
      if (API_BASE_URL.includes('your-api-id')) {
        throw new Error('PLACEHOLDER_URL');
      }

      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendTimer(60);
        setCopied(false);
        if (data.devModeOtp) {
          setOtpCode(data.devModeOtp);
          setShowToast(true);
        } else {
          setShowToast(false);
        }
      } else {
        setErrorMsg(data.message || 'Could not resend verification code.');
      }
    } catch (error: unknown) {
      const isPlaceholder = error instanceof Error && error.message === 'PLACEHOLDER_URL';
      if (isPlaceholder || error instanceof TypeError) {
        console.warn('Falling back to local sandbox resend.');
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpCode(generatedCode);
        setResendTimer(60);
        setCopied(false);
        setShowToast(true);
      } else {
        console.error('Resend connection failed:', error);
        setErrorMsg('Failed to connect to the authentication server.');
      }
    }
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await login(name.trim(), email.trim(), role, enteredOtp);
      if (!result.success) {
        setErrorMsg(result.message);
        setIsVerifying(false);
      }
    } catch {
      setErrorMsg('Network error. Unable to reach authentication service.');
      setIsVerifying(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(otpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackToLogin = () => {
    setIsOtpSent(false);
    setEnteredOtp('');
    setErrorMsg('');
    setShowToast(false);
  };

  return (
    <div style={styles.loginContainer}>
      
      {/* Subtle background pattern */}
      <div style={styles.bgPattern} />

      {/* Simulated OTP Notification Toast */}
      {showToast && (
        <div style={styles.toast} onClick={handleCopyCode} title="Click to copy code">
          <div style={styles.toastHeader}>
            <ShieldAlert size={15} color="var(--theme-accent)" />
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Admin System [Dev Mode]</span>
            {copied ? (
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={10} /> Copied
              </span>
            ) : (
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to Copy</span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
            OTP sent to <strong>{email}</strong>:
          </p>
          <div style={styles.toastOtpCode}>{otpCode}</div>
        </div>
      )}

      <main style={styles.cardWrapper}>
        {/* Brand Header */}
        <header style={styles.header}>
          <div style={styles.logoIcon}>
            <Calendar size={28} color="#FFFFFF" />
          </div>
          <h1 style={styles.title}>Chronos</h1>
          <p style={styles.subtitle}>Workspace Portal Access</p>
        </header>

        {/* Secure connection indicator */}
        <div style={styles.secureIndicator}>
          <Lock size={12} color="var(--color-success)" />
          <span>SSO Verification • TLS 1.3 Secure Connection</span>
        </div>

        {/* OTP Input Form vs. Initial Credentials Form */}
        {!isOtpSent ? (
          <form onSubmit={handleRequestOtp} style={styles.form}>
            <div style={styles.roleSelectionHeader}>Select Role Access</div>

            {/* 3 Role Selection Cards */}
            <div style={styles.roleGrid}>
              <div
                onClick={() => handleRoleSelect('Employee')}
                style={{
                  ...styles.roleCard,
                  borderColor: role === 'Employee' ? '#3B82F6' : 'var(--border-color)',
                  background: role === 'Employee' ? '#EFF6FF' : '#FFFFFF',
                  boxShadow: role === 'Employee' ? '0 0 0 1px #3B82F6' : 'var(--shadow-sm)'
                }}
              >
                <User size={18} color={role === 'Employee' ? '#3B82F6' : 'var(--text-muted)'} />
                <div style={{ ...styles.cardLabel, color: role === 'Employee' ? '#1D4ED8' : 'var(--text-secondary)' }}>Employee</div>
              </div>

              <div
                onClick={() => handleRoleSelect('Manager')}
                style={{
                  ...styles.roleCard,
                  borderColor: role === 'Manager' ? '#8B5CF6' : 'var(--border-color)',
                  background: role === 'Manager' ? '#F5F3FF' : '#FFFFFF',
                  boxShadow: role === 'Manager' ? '0 0 0 1px #8B5CF6' : 'var(--shadow-sm)'
                }}
              >
                <Award size={18} color={role === 'Manager' ? '#8B5CF6' : 'var(--text-muted)'} />
                <div style={{ ...styles.cardLabel, color: role === 'Manager' ? '#6D28D9' : 'var(--text-secondary)' }}>Manager</div>
              </div>

              <div
                onClick={() => handleRoleSelect('HR')}
                style={{
                  ...styles.roleCard,
                  borderColor: role === 'HR' ? '#10B981' : 'var(--border-color)',
                  background: role === 'HR' ? '#ECFDF5' : '#FFFFFF',
                  boxShadow: role === 'HR' ? '0 0 0 1px #10B981' : 'var(--shadow-sm)'
                }}
              >
                <ShieldAlert size={18} color={role === 'HR' ? '#10B981' : 'var(--text-muted)'} />
                <div style={{ ...styles.cardLabel, color: role === 'HR' ? '#047857' : 'var(--text-secondary)' }}>HR Admin</div>
              </div>
            </div>

            {/* Name input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  id="login-name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-glass"
                  style={{ paddingLeft: '40px' }}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Corporate Email</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  id="login-email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass"
                  style={{ paddingLeft: '40px' }}
                  autoComplete="email"
                />
              </div>
            </div>

            {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '12px' }}
            >
              Continue with Email
            </button>
            
          </form>
        ) : (
          <form onSubmit={handleVerifyAndSubmit} style={styles.form}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Check your email</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                We sent a 6-digit verification code to <br/>
                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
            </div>

            {/* OTP code input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Verification Code</label>
              <div style={styles.inputWrapper}>
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={enteredOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // only allow numbers
                    setEnteredOtp(val);
                  }}
                  className="input-glass"
                  style={{ 
                    paddingLeft: '40px', 
                    letterSpacing: enteredOtp ? '8px' : 'normal', 
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    textAlign: enteredOtp ? 'center' : 'left'
                  }}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {isVerifying ? 'Verifying...' : 'Sign In'}
            </button>

            {/* Resend and timer options */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px' }}>
              {resendTimer > 0 ? (
                <span style={styles.resendText}>Resend code in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={handleResendOtp} style={styles.resendBtn}>
                  Resend OTP Code
                </button>
              )}
            </div>

            {/* Back to Edit Info */}
            <button type="button" onClick={handleBackToLogin} style={styles.backLink}>
              <ArrowLeft size={14} /> Back to Edit Details
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    background: '#F8FAFC',
    overflow: 'hidden'
  },
  bgPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
    backgroundSize: '32px 32px',
    opacity: 0.5,
    zIndex: 0
  },
  cardWrapper: {
    width: '100%',
    maxWidth: '440px',
    background: '#FFFFFF',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 40px',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 10
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '24px'
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'var(--theme-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(var(--theme-accent-rgb), 0.25)',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)',
    marginBottom: '4px',
    fontFamily: 'var(--font-display)'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  secureIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    marginBottom: '24px',
    background: '#ECFDF5',
    border: '1px solid #D1FAE5',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  roleSelectionHeader: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '-8px'
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  roleCard: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  cardLabel: {
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  errorBanner: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    textAlign: 'center',
    fontWeight: 500
  },
  toast: {
    position: 'fixed' as const,
    top: '24px',
    right: '24px',
    background: '#FFFFFF',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 9999,
    width: '320px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
    marginBottom: '8px'
  },
  toastOtpCode: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    letterSpacing: '6px',
    textAlign: 'center' as const,
    color: 'var(--text-primary)',
    marginTop: '8px',
    padding: '8px',
    background: '#F8FAFC',
    borderRadius: 'var(--radius-sm)',
    border: '1px dashed var(--border-color)'
  },
  resendBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--theme-accent)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontWeight: 500,
    padding: '4px 8px',
  },
  resendText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'color 0.2s ease',
    background: 'none',
    border: 'none',
    width: '100%',
    fontWeight: 500
  }
};
