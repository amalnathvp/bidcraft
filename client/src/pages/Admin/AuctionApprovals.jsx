import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

const AuctionApprovals = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState({});
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  const navigate = useNavigate();

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const endpoint = statusFilter === 'pending' 
        ? `/admin/auctions/pending?page=${currentPage}`
        : `/admin/auctions?status=${statusFilter}&page=${currentPage}`;
        
      const response = await fetch(`${import.meta.env.VITE_API}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuctions(data.data.auctions);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        console.error('Failed to fetch auctions');
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [currentPage, statusFilter]);

  const handleApprove = async (auctionId) => {
    setActionLoading(prev => ({ ...prev, [auctionId]: true }));
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API}/admin/auctions/${auctionId}/approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes })
      });

      if (response.ok) {
        await fetchAuctions(); // Refresh the list
        setAdminNotes('');
        alert('Auction approved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to approve auction: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error approving auction:', error);
      alert('Error approving auction');
    } finally {
      setActionLoading(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(prev => ({ ...prev, [selectedAuction._id]: true }));
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API}/admin/auctions/${selectedAuction._id}/reject`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          rejectionReason: rejectionReason.trim(),
          adminNotes: adminNotes.trim() || null
        })
      });

      if (response.ok) {
        await fetchAuctions(); // Refresh the list
        setShowRejectModal(false);
        setRejectionReason('');
        setAdminNotes('');
        setSelectedAuction(null);
        alert('Auction rejected successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to reject auction: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error rejecting auction:', error);
      alert('Error rejecting auction');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedAuction._id]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Auction Approvals</h1>
        <p className="text-gray-600">Review and approve auctions submitted by sellers</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['pending', 'approved', 'rejected', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  statusFilter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status} auctions
              </button>
            ))}
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading auctions...</p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 text-lg">No {statusFilter} auctions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div key={auction._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* Auction Image */}
              <div className="relative h-48">
                <img
                  src={auction.itemPhotos?.[0] || auction.itemPhoto || "https://picsum.photos/400/300"}
                  alt={auction.itemName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(auction.approvalStatus)}
                </div>
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                  {auction.itemCategory}
                </div>
              </div>

              {/* Auction Details */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                  {auction.itemName}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {auction.itemDescription}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Starting Price:</span>
                    <span className="font-semibold text-green-600">₹{auction.startingPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Seller:</span>
                    <span className="text-sm font-medium">{auction.seller?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Submitted:</span>
                    <span className="text-sm">{formatDate(auction.createdAt)}</span>
                  </div>
                  {auction.approvalDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {auction.approvalStatus === 'approved' ? 'Approved:' : 'Rejected:'}
                      </span>
                      <span className="text-sm">{formatDate(auction.approvalDate)}</span>
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                {auction.approvalStatus === 'rejected' && auction.rejectionReason && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {auction.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Admin Notes */}
                {auction.adminNotes && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>Admin Notes:</strong> {auction.adminNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {auction.approvalStatus === 'pending' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(auction._id)}
                        disabled={actionLoading[auction._id]}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {actionLoading[auction._id] ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAuction(auction);
                          setShowRejectModal(true);
                        }}
                        disabled={actionLoading[auction._id]}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                    
                    <div>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add admin notes (optional)"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        rows="2"
                      />
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => navigate(`/auction/${auction._id}`)}
                  className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Auction</h3>
            <p className="text-gray-600 mb-4">
              Rejecting: <strong>{selectedAuction?.itemName}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows="3"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Additional notes for internal use..."
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows="2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setAdminNotes('');
                  setSelectedAuction(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading[selectedAuction?._id]}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading[selectedAuction?._id] ? 'Rejecting...' : 'Reject Auction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionApprovals;