import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Review {
  _id: string;
  reviewer: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  reviewee: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  auction: {
    _id: string;
    title: string;
    images: string[];
  };
  order: string;
  rating: number;
  comment: string;
  type: 'buyer_to_seller' | 'seller_to_buyer';
  status: 'pending' | 'published' | 'reported';
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: Review[];
}

interface ReviewsPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

const ReviewsPage: React.FC<ReviewsPageProps> = ({ onNavigate }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('received');
  const [newReview, setNewReview] = useState({
    orderId: '',
    rating: 0,
    comment: '',
    type: 'buyer_to_seller' as 'buyer_to_seller' | 'seller_to_buyer'
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchReviews();
    fetchStats();
    fetchPendingOrders();
  }, [selectedTab]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const endpoint = selectedTab === 'received' ? '/reviews/received' : '/reviews/given';
      const response = await apiService.get(endpoint);
      
      if (response.success) {
        setReviews(response.data);
      } else {
        setError('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.get('/reviews/stats');
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await apiService.get('/orders/pending-reviews');
      
      if (response.success) {
        setPendingOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const submitReview = async () => {
    if (!newReview.orderId || !newReview.rating || !newReview.comment.trim()) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await apiService.post('/reviews', newReview);
      
      if (response.success) {
        setNewReview({
          orderId: '',
          rating: 0,
          comment: '',
          type: 'buyer_to_seller'
        });
        setShowReviewForm(false);
        fetchReviews();
        fetchPendingOrders();
        alert('Review submitted successfully');
      } else {
        alert(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const reportReview = async (reviewId: string) => {
    try {
      const response = await apiService.post(`/reviews/${reviewId}/report`, {
        reason: 'inappropriate_content'
      });
      
      if (response.success) {
        alert('Review reported successfully');
        fetchReviews();
      } else {
        alert('Failed to report review');
      }
    } catch (error) {
      console.error('Error reporting review:', error);
      alert('Failed to report review');
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => interactive && onRatingChange?.(star)}
            disabled={!interactive}
          >
            <i className="fas fa-star"></i>
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    const ratings = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratings[rating as keyof typeof ratings] || '';
  };

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate?.('home')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>
            <i className="fas fa-star"></i>
            My Reviews
          </h1>
          <button 
            className="btn-primary"
            onClick={() => setShowReviewForm(true)}
          >
            <i className="fas fa-plus"></i>
            Write Review
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {stats && (
          <div className="stats-section">
            <div className="stats-card">
              <div className="stat-item">
                <div className="stat-value">{stats.totalReviews}</div>
                <div className="stat-label">Total Reviews</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {stats.averageRating.toFixed(1)}
                  <i className="fas fa-star"></i>
                </div>
                <div className="stat-label">Average Rating</div>
              </div>
              <div className="rating-distribution">
                <h4>Rating Distribution</h4>
                {Object.entries(stats.ratingDistribution)
                  .reverse()
                  .map(([rating, count]) => (
                    <div key={rating} className="rating-bar">
                      <span className="rating-number">{rating}★</span>
                      <div className="bar-container">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="rating-count">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="reviews-tabs">
          <button
            className={`tab-btn ${selectedTab === 'received' ? 'active' : ''}`}
            onClick={() => setSelectedTab('received')}
          >
            Received Reviews
          </button>
          <button
            className={`tab-btn ${selectedTab === 'given' ? 'active' : ''}`}
            onClick={() => setSelectedTab('given')}
          >
            Given Reviews
          </button>
        </div>

        {showReviewForm && (
          <div className="review-form-modal">
            <div className="review-form-card">
              <div className="form-header">
                <h3>Write a Review</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowReviewForm(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="form-content">
                <div className="form-group">
                  <label>Select Order</label>
                  <select
                    value={newReview.orderId}
                    onChange={(e) => setNewReview({ ...newReview, orderId: e.target.value })}
                  >
                    <option value="">Choose an order to review</option>
                    {pendingOrders.map(order => (
                      <option key={order._id} value={order._id}>
                        {order.auction.title} - Order #{order._id.slice(-6)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Review Type</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        value="buyer_to_seller"
                        checked={newReview.type === 'buyer_to_seller'}
                        onChange={(e) => setNewReview({ ...newReview, type: e.target.value as any })}
                      />
                      <span>Review Seller</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        value="seller_to_buyer"
                        checked={newReview.type === 'seller_to_buyer'}
                        onChange={(e) => setNewReview({ ...newReview, type: e.target.value as any })}
                      />
                      <span>Review Buyer</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Rating</label>
                  {renderStars(newReview.rating, true, (rating) => 
                    setNewReview({ ...newReview, rating })
                  )}
                  <span className="rating-text">{getRatingText(newReview.rating)}</span>
                </div>

                <div className="form-group">
                  <label>Comment</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience with this transaction..."
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={submitReview}>
                    Submit Review
                  </button>
                  <button 
                    className="btn-ghost"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-star"></i>
              <h3>No reviews yet</h3>
              <p>
                {selectedTab === 'received' 
                  ? "You haven't received any reviews yet." 
                  : "You haven't given any reviews yet."
                }
              </p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="avatar">
                      {(selectedTab === 'received' ? review.reviewer : review.reviewee).profileImage ? (
                        <img 
                          src={(selectedTab === 'received' ? review.reviewer : review.reviewee).profileImage} 
                          alt="Profile" 
                        />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <div className="reviewer-details">
                      <h4>
                        {selectedTab === 'received' ? review.reviewer.username : review.reviewee.username}
                      </h4>
                      <span className="review-type">
                        {review.type === 'buyer_to_seller' ? 'Buyer Review' : 'Seller Review'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="review-meta">
                    {renderStars(review.rating)}
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="review-content">
                  <p>{review.comment}</p>
                </div>

                <div className="review-auction">
                  <div className="auction-info">
                    {review.auction.images?.[0] && (
                      <div className="auction-image">
                        <img src={review.auction.images[0]} alt={review.auction.title} />
                      </div>
                    )}
                    <div className="auction-details">
                      <h5>{review.auction.title}</h5>
                      <span className="order-id">Order #{review.order.slice(-6)}</span>
                    </div>
                  </div>

                  <div className="review-actions">
                    {selectedTab === 'received' && review.status === 'published' && (
                      <button
                        className="report-btn"
                        onClick={() => reportReview(review._id)}
                      >
                        <i className="fas fa-flag"></i>
                        Report
                      </button>
                    )}
                    <button
                      className="view-order-btn"
                      onClick={() => onNavigate?.('order-detail', { orderId: review.order })}
                    >
                      View Order
                    </button>
                  </div>
                </div>

                {review.status !== 'published' && (
                  <div className="review-status">
                    <i className={`fas ${review.status === 'pending' ? 'fa-clock' : 'fa-flag'}`}></i>
                    {review.status === 'pending' ? 'Under Review' : 'Reported'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .reviews-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .back-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-header h1 {
          margin: 0;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .stats-section {
          margin-bottom: 2rem;
        }

        .stats-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .stat-value i {
          color: #fbbf24;
          font-size: 1.5rem;
        }

        .stat-label {
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .rating-distribution h4 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .rating-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .rating-number {
          width: 30px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .bar-container {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .rating-count {
          width: 30px;
          text-align: right;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .reviews-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }

        .review-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .review-form-card {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0.25rem;
        }

        .form-content {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
        }

        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .radio-group {
          display: flex;
          gap: 1rem;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .star-rating {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .star {
          background: none;
          border: none;
          color: #d1d5db;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }

        .star.filled {
          color: #fbbf24;
        }

        .star:hover {
          color: #f59e0b;
        }

        .rating-text {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .review-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .reviewer-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar i {
          color: #6b7280;
          font-size: 1.25rem;
        }

        .reviewer-details h4 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
        }

        .review-type {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .review-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .review-date {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .review-content p {
          margin: 0 0 1rem 0;
          color: #374151;
          line-height: 1.6;
        }

        .review-auction {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .auction-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .auction-image {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
        }

        .auction-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .auction-details h5 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .order-id {
          color: #6b7280;
          font-size: 0.75rem;
        }

        .review-actions {
          display: flex;
          gap: 0.5rem;
        }

        .report-btn, .view-order-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .report-btn {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .view-order-btn {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .report-btn:hover {
          background: #fee2e2;
        }

        .view-order-btn:hover {
          background: #dbeafe;
        }

        .review-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.5rem;
          background: #f3f4f6;
          border-radius: 6px;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .btn-primary, .btn-ghost {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
        }

        .btn-ghost {
          background: none;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-ghost:hover {
          background: #f9fafb;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-state i {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
          color: #fbbf24;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-banner {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .stats-card {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .rating-distribution {
            grid-column: 1 / -1;
          }

          .review-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .review-meta {
            align-items: flex-start;
          }

          .review-auction {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .review-actions {
            align-self: stretch;
          }

          .review-actions button {
            flex: 1;
          }

          .form-actions {
            justify-content: stretch;
          }

          .form-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewsPage;
