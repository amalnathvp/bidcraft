import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getMyAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";

export const MyAuction = () => {
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["myauctions"],
    queryFn: getMyAuctions,
    staleTime: 30 * 1000,
  });

  if (isLoading) return <LoadingScreen />;

  const categories = [
    "all",
    ...new Set(data?.map((auction) => auction.itemCategory)),
  ];
  
  // Filter by both category and status
  const filteredAuctions = data?.filter((auction) => {
    const categoryMatch = filter === "all" || auction.itemCategory === filter;
    const statusMatch = statusFilter === "all" || auction.approvalStatus === statusFilter;
    return categoryMatch && statusMatch;
  });

  // Get approval status counts
  const statusCounts = data?.reduce((acc, auction) => {
    acc[auction.approvalStatus] = (acc[auction.approvalStatus] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Overview */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
            <div className="text-sm text-yellow-800">Pending Approval</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved || 0}</div>
            <div className="text-sm text-green-800">Approved</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected || 0}</div>
            <div className="text-sm text-red-800">Rejected</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{data?.length || 0}</div>
            <div className="text-sm text-blue-800">Total Auctions</div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Filter by Approval Status
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && ` (${statusCounts[status] || 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === category
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {filter === "all" ? "My All Auctions" : `${filter} Auctions`}
            {statusFilter !== "all" && ` - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredAuctions?.length || 0} items)
            </span>
          </h2>
        </div>

        {(filteredAuctions?.length || 0) === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">
              No auctions found with current filters.
            </p>
            {statusFilter === "pending" && (
              <p className="text-gray-400 text-sm mt-2">
                New auctions require admin approval before being visible to buyers.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 place-items-center gap-6">
            {filteredAuctions?.map((auction) => (
              <div key={auction._id} className="relative">
                <AuctionCard auction={auction} />
                
                {/* Approval Status Badge */}
                <div className="absolute top-2 left-2 z-10">
                  {auction.approvalStatus === 'pending' && (
                    <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-full text-xs font-medium">
                      ⏳ Pending Approval
                    </span>
                  )}
                  {auction.approvalStatus === 'approved' && (
                    <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded-full text-xs font-medium">
                      ✅ Approved
                    </span>
                  )}
                  {auction.approvalStatus === 'rejected' && (
                    <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded-full text-xs font-medium">
                      ❌ Rejected
                    </span>
                  )}
                </div>
                
                {/* Rejection Reason */}
                {auction.approvalStatus === 'rejected' && auction.rejectionReason && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {auction.rejectionReason}
                    </p>
                    {auction.adminNotes && (
                      <p className="text-sm text-red-700 mt-1">
                        <strong>Admin Notes:</strong> {auction.adminNotes}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Admin Notes for approved items */}
                {auction.approvalStatus === 'approved' && auction.adminNotes && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      <strong>Admin Notes:</strong> {auction.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
