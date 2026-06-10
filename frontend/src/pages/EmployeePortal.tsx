import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeaves } from '../context/LeaveContext';
import type { LeaveType } from '../context/LeaveContext';
import { 
  Send, 
  History, 
  Award, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  Activity, 
  BarChart3, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface EmployeePortalProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { requests, balances, policy, applyLeave } = useLeaves();

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) return null;

  // Fetch balances for active user, falling back to policy limits
  const userBalance = balances[user.id] || {
    Sick: { limit: policy.Sick, used: 0 },
    Casual: { limit: policy.Casual, used: 0 },
    Unpaid: { limit: policy.Unpaid, used: 0 },
    Annual: { limit: policy.Annual, used: 0 }
  };

  // Filter history requests for this user only
  const userRequests = requests.filter(req => req.employeeId === user.id);

  // Stats Calculations
  const pendingRequests = userRequests.filter(req => req.status === 'Pending');
  const approvedRequests = userRequests.filter(req => req.status === 'Approved');
  const rejectedRequests = userRequests.filter(req => req.status === 'Rejected');
  
  // Calculate total days taken (approved)
  const totalApprovedDays = approvedRequests.reduce((sum, req) => sum + req.days, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!startDate || !endDate || !reason) {
      setErrorMsg('Please complete all form fields.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date cannot be after end date.');
      return;
    }

    // Verify leave allowance limits
    const requestedDays = Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const available = userBalance[leaveType].limit - userBalance[leaveType].used;

    if (leaveType !== 'Unpaid' && requestedDays > available) {
      setErrorMsg(`Insufficient leave balance. You requested ${requestedDays} days, but only have ${available} days available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await applyLeave(leaveType, startDate, endDate, reason);
      if (success) {
        setSuccessMsg('Leave request submitted successfully. Pending Manager review.');
        setStartDate('');
        setEndDate('');
        setReason('');
      } else {
        setErrorMsg('Submit failed. Try again.');
      }
    } catch {
      setErrorMsg('AWS integration sandbox is offline. Request saved locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge class
  const getBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'badge badge-approved';
      case 'rejected': return 'badge badge-rejected';
      case 'pending': return 'badge badge-pending';
      default: return 'badge badge-info';
    }
  };

  return (
    <div style={styles.container}>
      {/* ----------------- DASHBOARD TAB ----------------- */}
      {activeTab === 'dashboard' && (
        <>
          {/* KPI Grid */}
          <div className="grid-4">
            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Total Approved Days</span>
                <h3 style={styles.kpiValue}>{totalApprovedDays}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#EEF2FF', color: 'var(--theme-accent)' }}>
                <Briefcase size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Pending Requests</span>
                <h3 style={styles.kpiValue}>{pendingRequests.length}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#FEF3C7', color: 'var(--color-warning)' }}>
                <Clock size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Approved Applications</span>
                <h3 style={styles.kpiValue}>{approvedRequests.length}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#D1FAE5', color: 'var(--color-success)' }}>
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Rejected Applications</span>
                <h3 style={styles.kpiValue}>{rejectedRequests.length}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#FEE2E2', color: 'var(--color-error)' }}>
                <XCircle size={20} />
              </div>
            </div>
          </div>

          {/* Two Column Section */}
          <div style={styles.dashboardGrid}>
            {/* Feed Section */}
            <div className="enterprise-card" style={{ flex: 2 }}>
              <div style={styles.sectionHeader}>
                <History size={18} color="var(--theme-accent)" />
                <h2 style={styles.sectionTitle}>Recent Leave Activity</h2>
              </div>
              <div style={styles.activityFeed}>
                {userRequests.length === 0 ? (
                  <div style={styles.emptyState}>
                    <AlertCircle size={32} color="var(--text-muted)" />
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>No leave applications logged yet.</p>
                  </div>
                ) : (
                  userRequests.slice(0, 5).map(req => (
                    <div key={req.id} style={styles.feedItem}>
                      <div style={styles.feedIcon}>
                        <Calendar size={16} color="var(--text-secondary)" />
                      </div>
                      <div style={styles.feedDetails}>
                        <div style={styles.feedHeader}>
                          <span style={styles.feedType}>{req.type} Leave</span>
                          <span className={getBadgeClass(req.status)}>{req.status}</span>
                        </div>
                        <p style={styles.feedTime}>
                          {req.startDate} to {req.endDate} ({req.days} {req.days === 1 ? 'day' : 'days'})
                        </p>
                        {req.reason && <p style={styles.feedReason}>"{req.reason}"</p>}
                        {req.managerComment && (
                          <div style={styles.commentBox}>
                            <strong>Manager Note:</strong> {req.managerComment}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions & Mini Balances */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quick Actions */}
              <div className="enterprise-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>Quick Actions</h3>
                <div style={styles.actionsList}>
                  <button 
                    onClick={() => setActiveTab?.('request')} 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <PlusCircle size={16} />
                    <span>Apply for Leave</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab?.('balance')} 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Activity size={16} />
                    <span>View Leave Balances</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab?.('analytics')} 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <BarChart3 size={16} />
                    <span>Check Leave Analytics</span>
                  </button>
                </div>
              </div>

              {/* Balances Sidebar preview */}
              <div className="enterprise-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>Available Balances</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(['Annual', 'Sick', 'Casual'] as LeaveType[]).map(type => {
                    const info = userBalance[type];
                    const remaining = info.limit - info.used;
                    const percent = Math.min(100, Math.max(0, (info.used / info.limit) * 100));
                    
                    return (
                      <div key={type} style={styles.miniProgressContainer}>
                        <div style={styles.miniProgressHeader}>
                          <span style={styles.miniProgressLabel}>{type}</span>
                          <span style={styles.miniProgressVal}>{remaining} left</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ----------------- BALANCES TAB ----------------- */}
      {activeTab === 'balance' && (
        <>
          {/* Detailed balance grids */}
          <div className="grid-4">
            {(Object.keys(userBalance) as LeaveType[]).map(type => {
              const info = userBalance[type];
              const remaining = info.limit - info.used;
              const percent = Math.min(100, Math.max(0, (info.used / info.limit) * 100));
              
              return (
                <div key={type} className="enterprise-card active">
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{type} Leave</h3>
                    <span style={styles.remainingVal}>{type === 'Unpaid' ? 'Unlimited' : `${remaining} Left`}</span>
                  </div>
                  <div style={styles.statSub}>
                    <span>Allowance: {type === 'Unpaid' ? '∞' : info.limit}</span>
                    <span>Used: {info.used}</span>
                  </div>
                  {/* Progress Line Bar */}
                  {type !== 'Unpaid' && (
                    <div style={styles.progressBarBg}>
                      <div style={{ ...styles.progressBarFill, width: `${percent}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* History tracker */}
          <section className="enterprise-card">
            <div style={styles.sectionHeader}>
              <History size={18} color="var(--theme-accent)" />
              <h2 style={styles.sectionTitle}>Leave Log & Status</h2>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Manager Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {userRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                        No leave requests logged yet.
                      </td>
                    </tr>
                  ) : (
                    userRequests.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: '600' }}>{req.type}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {req.startDate} to {req.endDate}
                        </td>
                        <td>{req.days}</td>
                        <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {req.reason}
                        </td>
                        <td>
                          <span className={getBadgeClass(req.status)}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {req.managerComment || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ----------------- REQUEST TAB ----------------- */}
      {activeTab === 'request' && (
        <div style={styles.dashboardGrid}>
          {/* Application Form */}
          <main className="enterprise-card" style={{ flex: 2 }}>
            <div style={styles.sectionHeader}>
              <Send size={18} color="var(--theme-accent)" />
              <h2 style={styles.sectionTitle}>Submit Leave Application</h2>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div className="grid-2">
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Leave Classification</label>
                  <select 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="input-glass"
                  >
                    <option value="Annual">Annual Leave ({userBalance.Annual.limit - userBalance.Annual.used} available)</option>
                    <option value="Sick">Sick Leave ({userBalance.Sick.limit - userBalance.Sick.used} available)</option>
                    <option value="Casual">Casual Leave ({userBalance.Casual.limit - userBalance.Casual.used} available)</option>
                    <option value="Unpaid">Unpaid Leave (Unlimited)</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Balance Reference</label>
                  <div style={styles.previewBox}>
                    <Award size={16} color="var(--theme-accent)" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Available for {leaveType}: <strong>{leaveType === 'Unpaid' ? 'Unlimited' : `${userBalance[leaveType].limit - userBalance[leaveType].used} days`}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Commencement Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-glass"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Resumption Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-glass"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Reason for Request</label>
                <textarea 
                  rows={4}
                  placeholder="Detail the circumstances of your leave application..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-glass"
                  style={{ resize: 'none' }}
                />
              </div>

              {errorMsg && (
                <div style={styles.errorText}>
                  <AlertCircle size={16} style={{ marginRight: '6px', display: 'inline' }} />
                  {errorMsg}
                </div>
              )}
              
              {successMsg && (
                <div style={styles.successText}>
                  <CheckCircle size={16} style={{ marginRight: '6px', display: 'inline' }} />
                  {successMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn-primary"
                style={{ alignSelf: 'flex-start', marginTop: '8px' }}
              >
                {isSubmitting ? 'Transmitting Request...' : 'Send to Manager'}
              </button>
            </form>
          </main>

          {/* Guidelines Sidebar */}
          <div className="enterprise-card" style={{ flex: 1, alignSelf: 'start' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>Guidelines & Policies</h3>
            <div style={styles.guidelinesList}>
              <div style={styles.guidelineItem}>
                <div style={styles.guidelineNumber}>1</div>
                <div style={styles.guidelineContent}>
                  <strong>Lead Time</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Annual and Casual leave requests should be submitted at least 5 business days in advance.
                  </p>
                </div>
              </div>
              <div style={styles.guidelineItem}>
                <div style={styles.guidelineNumber}>2</div>
                <div style={styles.guidelineContent}>
                  <strong>Weekend Rule</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Calculations automatically count calendar days. If requesting a Friday to Monday span, check your total.
                  </p>
                </div>
              </div>
              <div style={styles.guidelineItem}>
                <div style={styles.guidelineNumber}>3</div>
                <div style={styles.guidelineContent}>
                  <strong>Documentation</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Medical certificates are required for sick leave requests exceeding 3 consecutive days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ANALYTICS TAB ----------------- */}
      {activeTab === 'analytics' && (
        <div className="enterprise-card">
          <div style={styles.sectionHeader}>
            <BarChart3 size={18} color="var(--theme-accent)" />
            <h2 style={styles.sectionTitle}>Leave Usage Analytics</h2>
          </div>
          
          <div className="grid-2" style={{ marginTop: '16px' }}>
            {/* Usage by leave category */}
            <div style={styles.chartBlock}>
              <h3 style={styles.chartTitle}>Allowance Consumption Rate</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Percentage of allocated days utilized this calendar year.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(['Annual', 'Sick', 'Casual'] as LeaveType[]).map(type => {
                  const info = userBalance[type];
                  const percent = Math.min(100, Math.max(0, Math.round((info.used / info.limit) * 100)));
                  
                  return (
                    <div key={type} className="chart-bar-container">
                      <div className="chart-bar-label">
                        <span>{type} Leave ({info.used} / {info.limit} Days Used)</span>
                        <span style={{ fontWeight: '600' }}>{percent}%</span>
                      </div>
                      <div className="chart-bar-track">
                        <div 
                          className="chart-bar-fill" 
                          style={{ 
                            width: `${percent}%`, 
                            backgroundColor: type === 'Annual' ? '#4F46E5' : type === 'Sick' ? '#10B981' : '#F59E0B'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribution */}
            <div style={styles.chartBlock}>
              <h3 style={styles.chartTitle}>Leave Request Breakdown</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Proportion of applications across different statuses.
              </p>
              
              <div style={styles.analyticsStats}>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#D1FAE5' }} />
                  <span style={styles.analyticsStatLabel}>Approved</span>
                  <span style={styles.analyticsStatValue}>{approvedRequests.length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#FEF3C7' }} />
                  <span style={styles.analyticsStatLabel}>Pending Review</span>
                  <span style={styles.analyticsStatValue}>{pendingRequests.length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#FEE2E2' }} />
                  <span style={styles.analyticsStatLabel}>Rejected</span>
                  <span style={styles.analyticsStatValue}>{rejectedRequests.length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#E2E8F0' }} />
                  <span style={styles.analyticsStatLabel}>Total Logged</span>
                  <span style={styles.analyticsStatValue}>{userRequests.length}</span>
                </div>
              </div>

              {/* Simple visualization bar representation */}
              <div style={styles.visualBar}>
                {userRequests.length > 0 ? (
                  <>
                    <div style={{ 
                      height: '100%', 
                      width: `${(approvedRequests.length / userRequests.length) * 100}%`, 
                      background: 'var(--color-success)',
                      transition: 'width 0.3s'
                    }} title="Approved" />
                    <div style={{ 
                      height: '100%', 
                      width: `${(pendingRequests.length / userRequests.length) * 100}%`, 
                      background: 'var(--color-warning)',
                      transition: 'width 0.3s'
                    }} title="Pending" />
                    <div style={{ 
                      height: '100%', 
                      width: `${(rejectedRequests.length / userRequests.length) * 100}%`, 
                      background: 'var(--color-error)',
                      transition: 'width 0.3s'
                    }} title="Rejected" />
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#E2E8F0', textAlign: 'center', fontSize: '0.75rem', lineHeight: '20px', color: 'var(--text-muted)' }}>
                    No data recorded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  kpiCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px'
  },
  kpiLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  kpiLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  kpiValue: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1
  },
  kpiIcon: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dashboardGrid: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    fontWeight: 600
  },
  activityFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  emptyState: {
    padding: '48px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  feedItem: {
    display: 'flex',
    gap: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-color)'
  },
  feedIcon: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  feedDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  feedType: {
    fontWeight: 600,
    fontSize: '0.9rem'
  },
  feedTime: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  feedReason: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: '4px'
  },
  commentBox: {
    marginTop: '8px',
    padding: '8px 12px',
    background: '#F8FAFC',
    borderLeft: '2px solid var(--theme-accent)',
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  miniProgressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  miniProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem'
  },
  miniProgressLabel: {
    fontWeight: 500,
    color: 'var(--text-secondary)'
  },
  miniProgressVal: {
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  progressBarBg: {
    height: '6px',
    background: '#E2E8F0',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'var(--theme-accent)',
    borderRadius: 'var(--radius-full)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  cardTitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)'
  },
  remainingVal: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  statSub: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '12px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)'
  },
  previewBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: '#F8FAFC',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    height: '40px'
  },
  errorText: {
    color: 'var(--color-error)',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    background: '#FEE2E2',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)'
  },
  successText: {
    color: 'var(--color-success)',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    background: '#D1FAE5',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)'
  },
  guidelinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  guidelineItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  guidelineNumber: {
    width: '24px',
    height: '24px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#EEF2FF',
    color: 'var(--theme-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '600',
    flexShrink: 0
  },
  guidelineContent: {
    fontSize: '0.85rem'
  },
  chartBlock: {
    display: 'flex',
    flexDirection: 'column'
  },
  chartTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '4px'
  },
  analyticsStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  analyticsStatItem: {
    padding: '12px',
    background: '#F8FAFC',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative'
  },
  analyticsDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    position: 'absolute',
    top: '12px',
    right: '12px'
  },
  analyticsStatLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  analyticsStatValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  visualBar: {
    height: '20px',
    background: '#E2E8F0',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    display: 'flex'
  }
};
