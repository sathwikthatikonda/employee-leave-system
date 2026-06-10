/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

export type LeaveType = 'Sick' | 'Casual' | 'Unpaid' | 'Annual';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  managerComment?: string;
  createdAt: string;
}

export interface LeaveBalance {
  Sick: { limit: number; used: number };
  Casual: { limit: number; used: number };
  Unpaid: { limit: number; used: number };
  Annual: { limit: number; used: number };
}

interface LeaveContextType {
  requests: LeaveRequest[];
  balances: Record<string, LeaveBalance>;
  policy: Record<LeaveType, number>;
  applyLeave: (type: LeaveType, startDate: string, endDate: string, reason: string) => Promise<boolean>;
  approveLeave: (requestId: string, comment?: string) => Promise<boolean>;
  rejectLeave: (requestId: string, comment?: string) => Promise<boolean>;
  updateBalance: (employeeId: string, type: LeaveType, limit: number, used: number) => Promise<boolean>;
  updatePolicy: (type: LeaveType, limit: number) => Promise<boolean>;
}

const DEFAULT_POLICY: Record<LeaveType, number> = {
  Sick: 10,
  Casual: 8,
  Unpaid: 30,
  Annual: 20
};

const INITIAL_BALANCES: Record<string, LeaveBalance> = {
  'emp-1': {
    Sick: { limit: 10, used: 2 },
    Casual: { limit: 8, used: 3 },
    Unpaid: { limit: 30, used: 0 },
    Annual: { limit: 20, used: 5 }
  },
  'emp-2': {
    Sick: { limit: 10, used: 1 },
    Casual: { limit: 8, used: 2 },
    Unpaid: { limit: 30, used: 1 },
    Annual: { limit: 20, used: 8 }
  }
};

const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: 'req-1',
    employeeId: 'emp-1',
    employeeName: 'John Doe',
    employeeEmail: 'employee@company.com',
    department: 'Engineering',
    type: 'Annual',
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    days: 4,
    reason: 'Family trip to Yosemite.',
    status: 'Pending',
    createdAt: '2026-06-05'
  },
  {
    id: 'req-2',
    employeeId: 'emp-2',
    employeeName: 'Jane Smith',
    employeeEmail: 'employee2@company.com',
    department: 'Marketing',
    type: 'Sick',
    startDate: '2026-06-01',
    endDate: '2026-06-02',
    days: 2,
    reason: 'Fever and cold.',
    status: 'Approved',
    managerComment: 'Take care and recover!',
    createdAt: '2026-05-30'
  },
  {
    id: 'req-3',
    employeeId: 'emp-1',
    employeeName: 'John Doe',
    employeeEmail: 'employee@company.com',
    department: 'Engineering',
    type: 'Casual',
    startDate: '2026-05-10',
    endDate: '2026-05-11',
    days: 2,
    reason: 'Personal errands.',
    status: 'Approved',
    managerComment: 'Approved.',
    createdAt: '2026-05-08'
  }
];

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [requests, setRequests] = useState<LeaveRequest[]>(() => {
    const storedRequests = localStorage.getItem('elms_requests');
    if (storedRequests) {
      try {
        return JSON.parse(storedRequests);
      } catch {
        // ignore JSON parse errors, fall through to seed defaults
      }
    }
    localStorage.setItem('elms_requests', JSON.stringify(INITIAL_REQUESTS));
    return INITIAL_REQUESTS;
  });

  const [balances, setBalances] = useState<Record<string, LeaveBalance>>(() => {
    const storedBalances = localStorage.getItem('elms_balances');
    if (storedBalances) {
      try {
        return JSON.parse(storedBalances);
      } catch {
        // ignore JSON parse errors, fall through to seed defaults
      }
    }
    localStorage.setItem('elms_balances', JSON.stringify(INITIAL_BALANCES));
    return INITIAL_BALANCES;
  });

  const [policy, setPolicy] = useState<Record<LeaveType, number>>(() => {
    const storedPolicy = localStorage.getItem('elms_policy');
    if (storedPolicy) {
      try {
        return JSON.parse(storedPolicy);
      } catch {
        // ignore JSON parse errors, fall through to seed defaults
      }
    }
    localStorage.setItem('elms_policy', JSON.stringify(DEFAULT_POLICY));
    return DEFAULT_POLICY;
  });

  const calculateDays = (start: string, end: string): number => {
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const applyLeave = async (type: LeaveType, startDate: string, endDate: string, reason: string): Promise<boolean> => {
    if (!user) return false;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const days = calculateDays(startDate, endDate);
    const newRequest: LeaveRequest = {
      id: `req-${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      department: user.department,
      type,
      startDate,
      endDate,
      days,
      reason,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    localStorage.setItem('elms_requests', JSON.stringify(updatedRequests));

    return true;
  };

  const approveLeave = async (requestId: string, comment?: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        // Deduct balance on approval
        const empBalance = balances[req.employeeId] || {
          Sick: { limit: policy.Sick, used: 0 },
          Casual: { limit: policy.Casual, used: 0 },
          Unpaid: { limit: policy.Unpaid, used: 0 },
          Annual: { limit: policy.Annual, used: 0 }
        };

        const currentUsed = empBalance[req.type].used;
        const newUsed = currentUsed + req.days;

        const newBalances = {
          ...balances,
          [req.employeeId]: {
            ...empBalance,
            [req.type]: {
              ...empBalance[req.type],
              used: newUsed
            }
          }
        };

        setBalances(newBalances);
        localStorage.setItem('elms_balances', JSON.stringify(newBalances));

        return {
          ...req,
          status: 'Approved' as LeaveStatus,
          managerComment: comment
        };
      }
      return req;
    });

    setRequests(updatedRequests);
    localStorage.setItem('elms_requests', JSON.stringify(updatedRequests));
    return true;
  };

  const rejectLeave = async (requestId: string, comment?: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'Rejected' as LeaveStatus,
          managerComment: comment
        };
      }
      return req;
    });

    setRequests(updatedRequests);
    localStorage.setItem('elms_requests', JSON.stringify(updatedRequests));
    return true;
  };

  const updateBalance = async (employeeId: string, type: LeaveType, limit: number, used: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const currentBalances = { ...balances };
    const empBalance = currentBalances[employeeId] || {
      Sick: { limit: policy.Sick, used: 0 },
      Casual: { limit: policy.Casual, used: 0 },
      Unpaid: { limit: policy.Unpaid, used: 0 },
      Annual: { limit: policy.Annual, used: 0 }
    };

    const newBalances = {
      ...currentBalances,
      [employeeId]: {
        ...empBalance,
        [type]: { limit, used }
      }
    };

    setBalances(newBalances);
    localStorage.setItem('elms_balances', JSON.stringify(newBalances));
    return true;
  };

  const updatePolicy = async (type: LeaveType, limit: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newPolicy = {
      ...policy,
      [type]: limit
    };
    setPolicy(newPolicy);
    localStorage.setItem('elms_policy', JSON.stringify(newPolicy));
    return true;
  };

  return (
    <LeaveContext.Provider value={{
      requests,
      balances,
      policy,
      applyLeave,
      approveLeave,
      rejectLeave,
      updateBalance,
      updatePolicy
    }}>
      {children}
    </LeaveContext.Provider>
  );
};

export const useLeaves = () => {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeaves must be used within a LeaveProvider');
  }
  return context;
};
