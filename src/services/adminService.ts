import { apiService } from './api';

export interface DashboardStats {
  totalUsers: number;
  totalAuctions: number;
  totalRevenue: number;
  totalCommission: number;
  activeUsers: number;
  pendingApprovals: number;
  disputesOpen: number;
  fraudAlerts: number;
  recentActivity: {
    newUsersToday: number;
    newAuctionsToday: number;
    ordersToday: number;
  };
}

export interface UserAnalytics {
  usersByRole: Array<{
    _id: string;
    count: number;
  }>;
  usersByMonth: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
  }>;
}

export interface RevenueAnalytics {
  revenueByMonth: Array<{
    _id: {
      year: number;
      month: number;
    };
    totalRevenue: number;
    orderCount: number;
  }>;
  topSellingCategories: Array<{
    _id: string;
    revenue: number;
    orders: number;
  }>;
}

class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiService.get('/admin/dashboard/stats');
    return response.data;
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(): Promise<UserAnalytics> {
    const response = await apiService.get('/admin/analytics/users');
    return response.data;
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const response = await apiService.get('/admin/analytics/revenue');
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;