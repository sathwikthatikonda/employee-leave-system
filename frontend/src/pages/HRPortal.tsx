import React, { useState } from 'react';
import { useLeaves } from '../context/LeaveContext';
import type { LeaveType } from '../context/LeaveContext';
import { 
  Users, 
  Search, 
  Edit3, 
  Sliders, 
  Check, 
  Calendar,
  ShieldAlert,
  BarChart3,
  X
} from 'lucide-react';

interface HRPortalProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

export const HRPortal: React.FC<HRPortalProps> = ({ activeTab, setActiveTab }) => {
  const { requests, balances, policy, updateBalance, updatePolicy } = useLeaves();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Balance Editing Modal State
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editType, setEditType] = useState<LeaveType>('Annual');
  const [editLimit, setEditLimit] = useState(20);
  const [editUsed, setEditUsed] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Policy Settings State
  const [policyAnnual, setPolicyAnnual] = useState(policy.Annual);
  const [policySick, setPolicySick] = useState(policy.Sick);
  const [policyCasual, setPolicyCasual] = useState(policy.Casual);
  const [policyUnpaid, setPolicyUnpaid] = useState(policy.Unpaid);
  const [policySuccess, setPolicySuccess] = useState(false);

  // List of mock employees to resolve descriptions
  const employees = [
    { id: 'emp-1', name: 'John Doe', email: 'employee@company.com', department: 'Engineering' },
    { id: 'emp-2', name: 'Jane Smith', email: 'employee2@company.com', department: 'Marketing' }
  ];

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEditModal = (empId: string) => {
    const empBalance = balances[empId] || {
      Sick: { limit: policy.Sick, used: 0 },
      Casual: { limit: policy.Casual, used: 0 },
      Unpaid: { limit: policy.Unpaid, used: 0 },
      Annual: { limit: policy.Annual, used: 0 }
    };
    
    setEditingEmpId(empId);
    setEditType('Annual');
    setEditLimit(empBalance.Annual.limit);
    setEditUsed(empBalance.Annual.used);
    setSaveSuccess(false);
  };

  const handleLeaveTypeChange = (type: LeaveType) => {
    if (!editingEmpId) return;
    const empBalance = balances[editingEmpId] || {
      Sick: { limit: policy.Sick, used: 0 },
      Casual: { limit: policy.Casual, used: 0 },
      Unpaid: { limit: policy.Unpaid, used: 0 },
      Annual: { limit: policy.Annual, used: 0 }
    };
    
    setEditType(type);
    setEditLimit(empBalance[type].limit);
    setEditUsed(empBalance[type].used);
    setSaveSuccess(false);
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;

    await updateBalance(editingEmpId, editType, editLimit, editUsed);
    setSaveSuccess(true);
    setTimeout(() => {
      setEditingEmpId(null);
      setSaveSuccess(false);
    }, 800);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePolicy('Annual', policyAnnual);
    await updatePolicy('Sick', policySick);
    await updatePolicy('Casual', policyCasual);
    await updatePolicy('Unpaid', policyUnpaid);
    
    setPolicySuccess(true);
    setTimeout(() => setPolicySuccess(false), 2000);
  };

  // Stats Calculations
  const today = new Date().toISOString().split('T')[0];
  const outOfOfficeCount = requests.filter(req => req.status === 'Approved' && today >= req.startDate && today <= req.endDate).length;
  const pendingRequestsCount = requests.filter(req => req.status === 'Pending').length;
  const approvedRequests = requests.filter(req => req.status === 'Approved');



  return (
    <div style={styles.container}>
      {/* ----------------- DASHBOARD TAB ----------------- */}
      {activeTab === 'dashboard' && (
        <>
          {/* KPI Cards */}
          <div className="grid-4">
            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Active Employees</span>
                <h3 style={styles.kpiValue}>{employees.length}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#EFF6FF', color: 'var(--color-employee)' }}>
                <Users size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Out of Office Today</span>
                <h3 style={styles.kpiValue}>{outOfOfficeCount}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#F5F3FF', color: 'var(--color-manager)' }}>
                <Calendar size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Pending Applications</span>
                <h3 style={styles.kpiValue}>{pendingRequestsCount}</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#FEF3C7', color: 'var(--color-warning)' }}>
                <ShieldAlert size={20} />
              </div>
            </div>

            <div className="enterprise-card" style={styles.kpiCard}>
              <div style={styles.kpiLeft}>
                <span style={styles.kpiLabel}>Active Quotas Config</span>
                <h3 style={styles.kpiValue}>4</h3>
              </div>
              <div style={{ ...styles.kpiIcon, backgroundColor: '#ECFDF5', color: 'var(--color-hr)' }}>
                <Sliders size={20} />
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div style={styles.dashboardGrid}>
            {/* Left section: Department Quota Details */}
            <div className="enterprise-card" style={{ flex: 2 }}>
              <div style={styles.sectionHeader}>
                <Sliders size={18} color="var(--theme-accent)" />
                <h2 style={styles.sectionTitle}>Global Quota Rules</h2>
              </div>
              
              <div style={styles.quotaSummaryGrid}>
                <div style={styles.quotaSummaryBox}>
                  <strong>Annual Leave</strong>
                  <span style={styles.quotaDaysVal}>{policy.Annual} Days/Yr</span>
                  <p style={styles.quotaDesc}>Paid time off for personal and leisure use.</p>
                </div>
                <div style={styles.quotaSummaryBox}>
                  <strong>Sick Leave</strong>
                  <span style={styles.quotaDaysVal}>{policy.Sick} Days/Yr</span>
                  <p style={styles.quotaDesc}>Paid medical and recuperation leave.</p>
                </div>
                <div style={styles.quotaSummaryBox}>
                  <strong>Casual Leave</strong>
                  <span style={styles.quotaDaysVal}>{policy.Casual} Days/Yr</span>
                  <p style={styles.quotaDesc}>Short-term unplanned paid leave.</p>
                </div>
                <div style={styles.quotaSummaryBox}>
                  <strong>Unpaid Leave</strong>
                  <span style={styles.quotaDaysVal}>{policy.Unpaid} Days/Yr Max</span>
                  <p style={styles.quotaDesc}>Approved leaves with salary deduction.</p>
                </div>
              </div>
            </div>

            {/* Right section: Quick actions */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="enterprise-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>Quick Actions</h3>
                <div style={styles.actionsList}>
                  <button 
                    onClick={() => setActiveTab?.('directory')} 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Users size={16} />
                    <span>Manage Balances Directory</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab?.('policy')} 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Sliders size={16} />
                    <span>Configure Global Policies</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab?.('analytics')} 
                    className="btn-secondary" 
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <BarChart3 size={16} />
                    <span>Organization Analytics</span>
                  </button>
                </div>
              </div>

              {/* Department Leave Count */}
              <div className="enterprise-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 600 }}>Leaves by Department</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={styles.departmentItem}>
                    <span style={{ fontWeight: 500 }}>Engineering</span>
                    <span className="badge badge-info" style={{ fontWeight: '700' }}>
                      {requests.filter(r => r.department === 'Engineering').length}
                    </span>
                  </div>
                  <div style={styles.departmentItem}>
                    <span style={{ fontWeight: 500 }}>Marketing</span>
                    <span className="badge badge-info" style={{ fontWeight: '700' }}>
                      {requests.filter(r => r.department === 'Marketing').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ----------------- DIRECTORY TAB ----------------- */}
      {activeTab === 'directory' && (
        <>
          {/* Employee balances list */}
          <section className="enterprise-card">
            <div style={styles.sectionHeader}>
              <Users size={18} color="var(--theme-accent)" />
              <h2 style={styles.sectionTitle}>Employee Balances Directory</h2>
            </div>

            <div style={styles.searchBar}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search employees by name or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass"
                style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0 8px' }}
              />
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Annual (Used/Limit)</th>
                    <th>Sick (Used/Limit)</th>
                    <th>Casual (Used/Limit)</th>
                    <th>Unpaid (Used/Limit)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const empBal = balances[emp.id] || {
                      Sick: { limit: policy.Sick, used: 0 },
                      Casual: { limit: policy.Casual, used: 0 },
                      Unpaid: { limit: policy.Unpaid, used: 0 },
                      Annual: { limit: policy.Annual, used: 0 }
                    };
                    
                    return (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: '600' }}>{emp.name}</td>
                        <td>{emp.department}</td>
                        <td>{empBal.Annual.used} / {empBal.Annual.limit}</td>
                        <td>{empBal.Sick.used} / {empBal.Sick.limit}</td>
                        <td>{empBal.Casual.used} / {empBal.Casual.limit}</td>
                        <td>{empBal.Unpaid.used} / {empBal.Unpaid.limit}</td>
                        <td>
                          <button 
                            onClick={() => openEditModal(emp.id)}
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <Edit3 size={12} />
                            <span>Modify</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Edit balance modal */}
          {editingEmpId && (
            <div style={styles.modalBackdrop}>
              <div style={styles.modalContent} className="enterprise-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                    Adjust Balances for {employees.find(e => e.id === editingEmpId)?.name}
                  </h3>
                  <button 
                    onClick={() => setEditingEmpId(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSaveBalance} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Leave Type</label>
                    <select 
                      value={editType} 
                      onChange={(e) => handleLeaveTypeChange(e.target.value as LeaveType)}
                      className="input-glass"
                    >
                      <option value="Annual">Annual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Unpaid">Unpaid Leave</option>
                    </select>
                  </div>

                  <div className="grid-2">
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Max Allocation Limit</label>
                      <input 
                        type="number" 
                        value={editLimit} 
                        onChange={(e) => setEditLimit(parseInt(e.target.value) || 0)}
                        className="input-glass"
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Days Already Taken</label>
                      <input 
                        type="number" 
                        value={editUsed} 
                        onChange={(e) => setEditUsed(parseInt(e.target.value) || 0)}
                        className="input-glass"
                      />
                    </div>
                  </div>

                  {saveSuccess && (
                    <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <Check size={16} />
                      <span>Balances Saved Successfully.</span>
                    </div>
                  )}

                  <div style={styles.modalButtons}>
                    <button 
                      type="button" 
                      onClick={() => setEditingEmpId(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ----------------- POLICY TAB ----------------- */}
      {activeTab === 'policy' && (
        <main className="enterprise-card" style={styles.policyCard}>
          <div style={styles.sectionHeader}>
            <Sliders size={18} color="var(--theme-accent)" />
            <h2 style={styles.sectionTitle}>Leave Policy Allocations</h2>
          </div>

          <form onSubmit={handleSavePolicy} style={styles.form}>
            <div className="grid-2">
              <div style={styles.inputGroup}>
                <label style={styles.label}>Annual Leave Limit (Days/Yr)</label>
                <input 
                  type="number" 
                  value={policyAnnual}
                  onChange={(e) => setPolicyAnnual(parseInt(e.target.value) || 0)}
                  className="input-glass"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Sick Leave Limit (Days/Yr)</label>
                <input 
                  type="number" 
                  value={policySick}
                  onChange={(e) => setPolicySick(parseInt(e.target.value) || 0)}
                  className="input-glass"
                />
              </div>
            </div>

            <div className="grid-2">
              <div style={styles.inputGroup}>
                <label style={styles.label}>Casual Leave Limit (Days/Yr)</label>
                <input 
                  type="number" 
                  value={policyCasual}
                  onChange={(e) => setPolicyCasual(parseInt(e.target.value) || 0)}
                  className="input-glass"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Unpaid Leave Max Buffer (Days/Yr)</label>
                <input 
                  type="number" 
                  value={policyUnpaid}
                  onChange={(e) => setPolicyUnpaid(parseInt(e.target.value) || 0)}
                  className="input-glass"
                />
              </div>
            </div>

            {policySuccess && (
              <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Check size={16} />
                <span>Default leave quotas updated globally.</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: '12px' }}
            >
              Apply Global Policies
            </button>
          </form>
        </main>
      )}

      {/* ----------------- ANALYTICS TAB ----------------- */}
      {activeTab === 'analytics' && (
        <div className="enterprise-card">
          <div style={styles.sectionHeader}>
            <BarChart3 size={18} color="var(--theme-accent)" />
            <h2 style={styles.sectionTitle}>Organization Leave Analytics</h2>
          </div>

          <div className="grid-2" style={{ marginTop: '16px' }}>
            {/* Visual metrics bar */}
            <div style={styles.chartBlock}>
              <h3 style={styles.chartTitle}>Approved Leave Distribution</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Total leave applications by type across all employees.
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

            {/* Total operations summary */}
            <div style={styles.chartBlock}>
              <h3 style={styles.chartTitle}>Global System Status</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Consolidated workflow state across the workspace.
              </p>

              <div style={styles.analyticsStats}>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#D1FAE5' }} />
                  <span style={styles.analyticsStatLabel}>Total Approved Applications</span>
                  <span style={styles.analyticsStatValue}>{approvedRequests.length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#FEF3C7' }} />
                  <span style={styles.analyticsStatLabel}>Total Pending Review</span>
                  <span style={styles.analyticsStatValue}>{pendingRequestsCount}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#FEE2E2' }} />
                  <span style={styles.analyticsStatLabel}>Total Rejected Requests</span>
                  <span style={styles.analyticsStatValue}>{requests.filter(r => r.status === 'Rejected').length}</span>
                </div>
                <div style={styles.analyticsStatItem}>
                  <span style={{ ...styles.analyticsDot, backgroundColor: '#4F46E5' }} />
                  <span style={styles.analyticsStatLabel}>Registered Staff Members</span>
                  <span style={styles.analyticsStatValue}>{employees.length}</span>
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
  quotaSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  quotaSummaryBox: {
    padding: '20px',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-sm)'
  },
  quotaDaysVal: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--theme-accent)'
  },
  quotaDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  departmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#F8FAFC',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px',
    background: '#FFFFFF',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: 'var(--shadow-sm)'
  },
  policyCard: {
    maxWidth: '700px'
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
  modalBackdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    padding: '32px',
    background: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)'
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px'
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
