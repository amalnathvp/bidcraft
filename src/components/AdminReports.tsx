import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminReportsProps {
  onNavigate: (page: string, data?: any) => void;
}

interface Report {
  _id: string;
  type: 'auction' | 'user' | 'bid';
  reportedItem: {
    _id: string;
    title?: string;
    name?: string;
  };
  reporter: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

const AdminReports: React.FC<AdminReportsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resolution, setResolution] = useState('');

  // Load reports
  useEffect(() => {
    const loadReports = async () => {
      try {
        // Mock data for now - replace with real API call
        setTimeout(() => {
          const mockReports: Report[] = [
            {
              _id: '1',
              type: 'auction',
              reportedItem: {
                _id: 'auction1',
                title: 'Suspicious Pottery Item'
              },
              reporter: {
                _id: 'user1',
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com'
              },
              reason: 'inappropriate_content',
              description: 'This item appears to be mass-produced, not handcrafted as claimed.',
              status: 'pending',
              createdAt: '2025-08-30T14:30:00Z'
            },
            {
              _id: '2',
              type: 'user',
              reportedItem: {
                _id: 'user2',
                name: 'Fake Seller Account'
              },
              reporter: {
                _id: 'user3',
                firstName: 'Bob',
                lastName: 'Wilson',
                email: 'bob@example.com'
              },
              reason: 'fraudulent_activity',
              description: 'This seller is using stolen images and fake credentials.',
              status: 'pending',
              createdAt: '2025-08-29T16:45:00Z'
            },
            {
              _id: '3',
              type: 'auction',
              reportedItem: {
                _id: 'auction2',
                title: 'Vintage Textile'
              },
              reporter: {
                _id: 'user4',
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice@example.com'
              },
              reason: 'misleading_description',
              description: 'Item condition does not match the description provided.',
              status: 'resolved',
              createdAt: '2025-08-28T09:15:00Z',
              resolvedAt: '2025-08-29T10:30:00Z',
              resolution: 'Contacted seller to update description. Warning issued.'
            }
          ];
          
          setReports(mockReports);
          setFilteredReports(mockReports);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading reports:', error);
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      loadReports();
    }
  }, [user]);

  // Filter reports
  useEffect(() => {
    let filtered = reports;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(report => report.type === filterType);
    }

    setFilteredReports(filtered);
  }, [reports, filterStatus, filterType]);

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      console.log(`${action}ing report ${reportId} with resolution: ${resolution}`);
      
      const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';
      
      setReports(reports.map(report => 
        report._id === reportId 
          ? { 
              ...report, 
              status: newStatus,
              resolvedAt: new Date().toISOString(),
              resolution: resolution || `Report ${action}d by admin`
            }
          : report
      ));
      
      setShowModal(false);
      setSelectedReport(null);
      setResolution('');
      
      alert(`Report ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing report:`, error);
      alert(`Failed to ${action} report. Please try again.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'dismissed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auction': return '🏷️';
      case 'user': return '👤';
      case 'bid': return '💰';
      default: return '📋';
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons: { [key: string]: string } = {
      'inappropriate_content': 'Inappropriate Content',
      'fraudulent_activity': 'Fraudulent Activity',
      'misleading_description': 'Misleading Description',
      'copyright_violation': 'Copyright Violation',
      'spam': 'Spam',
      'other': 'Other'
    };
    return reasons[reason] || reason;
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return (
      <div className="admin-reports loading">
        <div className="container">
          <h1>Loading Reports...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <button 
            className="back-button"
            onClick={() => onNavigate('admin-dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Reports & Moderation</h1>
          <p>Handle user reports and platform violations</p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-controls">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="auction">Auction Reports</option>
              <option value="user">User Reports</option>
              <option value="bid">Bid Reports</option>
            </select>
          </div>

          <div className="report-stats">
            <div className="stat-item urgent">
              <span className="count">{reports.filter(r => r.status === 'pending').length}</span>
              <span className="label">Pending</span>
            </div>
            <div className="stat-item">
              <span className="count">{reports.filter(r => r.status === 'resolved').length}</span>
              <span className="label">Resolved</span>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="reports-list">
          {filteredReports.map(report => (
            <div key={report._id} className={`report-card ${report.status}`}>
              <div className="report-header">
                <div className="report-type">
                  <span className="type-icon">{getTypeIcon(report.type)}</span>
                  <span className="type-label">{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</span>
                </div>
                
                <div className="report-status">
                  <span 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(report.status) }}
                  >
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="report-content">
                <div className="reported-item">
                  <strong>Reported {report.type}:</strong> {report.reportedItem.title || report.reportedItem.name}
                </div>
                
                <div className="reporter-info">
                  <strong>Reported by:</strong> {report.reporter.firstName} {report.reporter.lastName} 
                  ({report.reporter.email})
                </div>
                
                <div className="report-reason">
                  <strong>Reason:</strong> {getReasonLabel(report.reason)}
                </div>
                
                <div className="report-description">
                  <strong>Description:</strong> {report.description}
                </div>
                
                <div className="report-date">
                  <strong>Reported:</strong> {new Date(report.createdAt).toLocaleString()}
                </div>

                {report.status !== 'pending' && report.resolvedAt && (
                  <div className="resolution-info">
                    <div><strong>Resolved:</strong> {new Date(report.resolvedAt).toLocaleString()}</div>
                    {report.resolution && (
                      <div><strong>Resolution:</strong> {report.resolution}</div>
                    )}
                  </div>
                )}
              </div>

              {report.status === 'pending' && (
                <div className="report-actions">
                  <button
                    className="action-btn resolve"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                  >
                    Take Action
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="no-results">
            <h3>No reports found</h3>
            <p>No reports match your current filter criteria.</p>
          </div>
        )}

        {/* Report Action Modal */}
        {showModal && selectedReport && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Resolve Report</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="report-summary">
                <p><strong>Report:</strong> {selectedReport.reportedItem.title || selectedReport.reportedItem.name}</p>
                <p><strong>Reason:</strong> {getReasonLabel(selectedReport.reason)}</p>
                <p><strong>Description:</strong> {selectedReport.description}</p>
              </div>

              <div className="form-group">
                <label htmlFor="resolution">Resolution Notes</label>
                <textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe the action taken and resolution..."
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleReportAction(selectedReport._id, 'dismiss')}
                >
                  Dismiss Report
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleReportAction(selectedReport._id, 'resolve')}
                >
                  Resolve Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
