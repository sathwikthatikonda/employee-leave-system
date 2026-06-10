import React, { useState } from 'react';
import { useLeaves } from '../context/LeaveContext';
import type { LeaveType } from '../context/LeaveContext';
import { 
  Check, 
  X, 
  ShieldAlert, 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  BarChart3
} from 'lucide-react';

interface ManagerPortalProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({ activeTab, setActiveTab }) => {
  const { requests, approveLeave, rejectLeave } = useLeaves();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Filter pending requests
  const pendingRequests = requests.filter(req => req.status === 'Pending');
  
  // Filter active leaves (Approved leaves happening now or upcoming)
  const approvedRequests = requests.filter(req => req.status === 'Approved');
  const rejectedRequests = requests.filter(req => req.status === 'Rejected');

  const today = new Date().toISOString().split('T')[0];
  const currentlyOnLeave = approvedRequests.filter(req => {
    return today >= req.startDate && today <= req.endDate;
  });

  // Calculate unique direct reports
  const uniqueReports = Array.from(new Set(requests.map(r => r.employeeId)));
  const reportsCount = uniqueReports.length || 4; // default to 4 if empty

  const handleCommentChange = (reqId: string, val: string) => {
    setComments(prev => ({ ...prev, [reqId]: val }));
  };

  const handleApprove = async (reqId: string) => {
    setActioningId(reqId);
    await approveLeave(reqId, comments[reqId] || 'Approved by Manager');
    setActioningId(null);
  };

  const handleReject = async (reqId: string) => {
    setActioningId(reqId);
    await rejectLeave(reqId, comments[reqId] || 'Rejected by Manager');
    setActioningId(null);
  };



  return (
    <div style={styles.container}>
      {/* ----------------- DASHBOARD TAB ----------------- */}
      {activeTab === 'dashboard' && (
        <>
          {/* KPI Cards */}
          <div className="grid-4">
            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Pending Approvals</span>
                <h3 style={styles.kpiValue}>{pendingRequests.length}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#FEF3C7', color: 'var(--color-warning)' }}>
                <Clock size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Currently On Leave</span>
                <h3 style={styles.kpiValue}>{currentlyOnLeave.length}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#EEF2FF', color: 'var(--theme-accent)' }}>
                <Calendar size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Direct Reports</span>
                <h3 style={styles.kpiValue}>{reportsCount}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#ECFDF5', color: 'var(--color-hr)' }}>
                <Users size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Leaves Approved</span>
                <h3 style={styles.kpiValue}>{approvedRequests.length}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#DBEAFE', color: 'var(--color-employee)' }}>
                <CheckCircle size={20} />
              </div>
            </div>
          </div>

          {/* Two Column Section */}
          <div style={styles.dashboardGrid}>
            {/* Pending Requests Actions List */}
            <div className="enterprise-card" style={{ flex: 2 }}>
              <div style={styles.sectionHeader}>
                <ShieldAlert size={18} color="var(--theme-accent)" />
                <h2 style={styles.sectionTitle}>Action Center</h2>
              </div>
              
              {pendingRequests.length === 0 ? (
                <div style={styles.emptyState}>
                  <CheckCircle size={36} color="var(--color-success)" />
                  <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>All leave applications reviewed. Good job!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingRequests.slice(0, 3).map(req => (
                    <div key={req.id} style={styles.actionCard}>
                      <div style={styles.actionHeader}>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{req.employeeName}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.department} • {req.type} Leave</div>
                        </div>
                        <span className="badge badge-pending">Pending</span>
                      </div>
                      <div style={styles.actionBody}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <strong>Duration:</strong> {req.startDate} to {req.endDate} ({req.days} days)
                        </div>
                        {req.reason && <p style={styles.reasonQuote}>"{req.reason}"</p>}
                      </div>
                      <div style={styles.actionFooter}>
                        <input 
                          type="text" 
                          placeholder="Provide optional review note..."
                          value={comments[req.id] || ''}
                          onChange={(e) => handleCommentChange(req.id, e.target.value)}
                          className="input-glass"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                        />
                        <div style={styles.actionButtons}>
                          <button 
                            onClick={() => handleReject(req.id)}
                            disabled={actioningId === req.id}
                            className="btn-secondary"
                            style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', padding: '8px 12px', fontSize: '0.85rem' }}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                          <button 
                            onClick={() => handleApprove(req.id)}
                            disabled={actioningId === req.id}
                            className="btn-primary"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingRequests.length > 3 && (
                    <button 
                      onClick={() => setActiveTab?.('approvals')}
                      className="btn-secondary"
                      style={{ alignSelf: 'center', marginTop: '8px' }}
                    >
                      View All {pendingRequests.length} Pending
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="enterprise-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>Quick Actions</h3>
                <div style={styles.actionsList}>
                  <button 
                    onClick={() => setActiveTab?.('approvals')} 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <FileText size={16} />
                    <span>Review Pending ({pendingRequests.length})</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab?.('calendar')} 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Calendar size={16} />
                    <span>View Team Schedule</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab?.('analytics')} 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <BarChart3 size={16} />
                    <span>Team Leave Analytics</span>
                  </button>
                </div>
              </div>

              {/* Currently on leave list */}
              <div className="enterprise-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 600 }}>Currently On Leave</h3>
                {currentlyOnLeave.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nobody is currently on leave.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentlyOnLeave.map(req => (
                      <div key={req.id} style={styles.activeLeaveItem}>
                        <div style={styles.avatarMini}>
                          {req.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{req.employeeName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Resumes {req.endDate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ----------------- APPROVALS TAB ----------------- */}
      {activeTab === 'approvals' && (
        <section className="enterprise-card">
          <div style={styles.sectionHeader}>
            <ShieldAlert size={18} color="var(--theme-accent)" />
            <h2 style={styles.sectionTitle}>Review Pending Leave Applications</h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <CheckCircle size={48} color="var(--color-success)" />
              <h3 style={{ marginTop: '16px', fontSize: '1.1rem' }}>No pending tasks!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>All leave applications have been reviewed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pendingRequests.map(req => (
                <div key={req.id} style={styles.approvalDetailCard}>
                  <div style={styles.approvalDetailHeader}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{req.employeeName}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {req.employeeEmail} • {req.department}
                      </span>
                    </div>
                    <span className="badge badge-pending">{req.type} Leave</span>
                  </div>
                  
                  <div style={styles.approvalDetails}>
                    <div style={styles.detailGrid}>
                      <div>
                        <span style={styles.detailLabel}>Duration</span>
                        <p style={styles.detailVal}>{req.startDate} to {req.endDate}</p>
                      </div>
                      <div>
                        <span style={styles.detailLabel}>Total Days Requested</span>
                        <p style={styles.detailVal}>{req.days} days</p>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <span style={styles.detailLabel}>Reason for Request</span>
                      <p style={{ ...styles.detailVal, fontStyle: 'italic', marginTop: '4px' }}>"{req.reason}"</p>
                    </div>
                  </div>

                  <div style={styles.approvalActionSection}>
                    <input 
                      type="text" 
                      placeholder="Add reviewer comments or reasons here..."
                      value={comments[req.id] || ''}
                      onChange={(e) => handleCommentChange(req.id, e.target.value)}
                      className="input-glass"
                      style={{ flex: 1 }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => handleReject(req.id)}
                        disabled={actioningId === req.id}
                        className="btn-secondary"
                        style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', minWidth: '100px' }}
                      >
                        <X size={16} />
                        <span>Reject</span>
                      </button>
                      <button 
                        onClick={() => handleApprove(req.id)}
                        disabled={actioningId === req.id}
                        className="btn-primary"
                        style={{ minWidth: '100px' }}
                      >
                        <Check size={16} />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ----------------- CALENDAR TAB ----------------- */}
      {activeTab === 'calendar' && (
        <main className="enterprise-card">
          <div style={styles.sectionHeader}>
            <Calendar size={18} color="var(--theme-accent)" />
            <h2 style={styles.sectionTitle}>Team Availability Schedule</h2>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      No leave schedules registered for team members.
                    </td>
                  </tr>
                ) : (
                  approvedRequests.map(req => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: '600' }}>{req.employeeName}</td>
                      <td>{req.type}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{req.startDate}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{req.endDate}</td>
                      <td>{req.days} days</td>
                      <td>
                        <span className="badge badge-approved">Scheduled</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* ----------------- ANALYTICS TAB ----------------- */}
      {activeTab === 'analytics' && (
        <div className="enterprise-card">
          <div style={styles.sectionHeader}>
            <BarChart3 size={18} color="var(--theme-accent)" />
            <h2 style={styles.sectionTitle}>Department Leave Analytics</h2>
          </div>

          <div className="grid-2" style={{ marginTop: '16px' }}>
            {/* Visual metrics bar */}
            <div style={styles.chartBlock}>
              <h3 style={styles.chartTitle}>Leave Category Distribution</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Distribution of leave types approved across the team.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(['Annual', 'Sick', 'Casual', 'Unpaid'] as LeaveType[]).map(type => {
                  const count = approvedRequests.filter(r => r.type === type).length;
                  const total = approvedRequests.length || 1;
                  const percent = Math.min(100, Math.max(0, Math.round((count / total) * 100)));

                  return (
                    <div key={type} className="chart-bar-container">
                      <div className="chart-bar-label">
                        <span>{type} Leave ({count} Approved Requests)</span>
                        <span style={{ fontWeight: '600' }}>{percent}%</span>
                      </div>
                      <div className="chart-bar-track">
                        <div 
                          className="chart-bar-fill" 
                          style={{ 
                            width: `${percent}%`, 
                            backgroundColor: type === 'Annual' ? '#4F46E5' : type === 'Sick' ? '#10B981' : type === 'Casual' ? '#F59E0B' : '#EF4444'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team request summaries */}
            <div style={styles.chartBlock}>
              <h3 style={styles.chartTitle}>Operational Leave Summary</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Aggregate team application metrics.
              </p>

              <div style={styles.analyticsStats}>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#D1FAE5' }} />
                  <span style={styles.analyticsStatLabel}>Approved Request Count</span>
                  <span style={styles.analyticsStatValue}>{approvedRequests.length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#FEF3C7' }} />
                  <span style={styles.analyticsStatLabel}>Pending Applications</span>
                  <span style={styles.analyticsStatValue}>{pendingRequests.length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#FEE2E2' }} />
                  <span style={styles.analyticsStatLabel}>Rejected Applications</span>
                  <span style={styles.analyticsStatValue}>{rejectedRequests.length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#4F46E5' }} />
                  <span style={styles.analyticsStatLabel}>Total Applications Processed</span>
                  <span style={styles.analyticsStatValue}>{requests.length}</span>
                </div>
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
  emptyState: {
    padding: '48px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  actionCard: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-sm)'
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  actionBody: {
    background: '#F8FAFC',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)'
  },
  reasonQuote: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginTop: '6px'
  },
  actionFooter: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  activeLeaveItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid var(--border-color)'
  },
  avatarMini: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#EEF2FF',
    color: 'var(--theme-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  approvalDetailCard: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: 'var(--shadow-sm)'
  },
  approvalDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  approvalDetails: {
    background: '#F8FAFC',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px'
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  detailVal: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
    marginTop: '2px'
  },
  approvalActionSection: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginTop: '4px'
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
    gap: '12px'
  },
  analyticsStatItem: {
    padding: '16px',
    background: '#F8FAFC',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    position: 'relative'
  },
  analyticsDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    position: 'absolute',
    top: '16px',
    right: '16px'
  },
  analyticsStatLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  analyticsStatValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  }
};
