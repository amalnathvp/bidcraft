import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  CiUser, CiMail, CiPhone, CiLocationOn, CiGlobe, CiCamera, CiStar,
  CiShop, CiEdit
} from "react-icons/ci";
import { FaFacebook, FaTwitter, FaInstagram, FaMapMarkerAlt, FaCheck, FaBuilding } from "react-icons/fa";
import LoadingScreen from "../components/LoadingScreen";

const fetchSellerProfile = async () => {
  const response = await fetch('/user/profile', {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
};

const updateSellerProfile = async (profileData) => {
  const response = await fetch('/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  return response.json();
};

const uploadProfileImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('avatar', imageFile);
  
  const response = await fetch('/user/profile/upload-image', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  return response.json();
};

export default function SellerProfile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    businessAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    taxId: "",
    website: "",
    description: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: ""
    },
    avatar: ""
  });

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['sellerProfile'],
    queryFn: fetchSellerProfile,
  });

  const updateMutation = useMutation({
    mutationFn: updateSellerProfile,
    onSuccess: (data) => {
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      queryClient.invalidateQueries(['sellerProfile']);
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to update profile");
      setTimeout(() => setErrorMessage(""), 5000);
    },
  });

  const imageUploadMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: (data) => {
      setSuccessMessage("Profile image updated successfully!");
      queryClient.invalidateQueries(['sellerProfile']);
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to upload image");
      setTimeout(() => setErrorMessage(""), 5000);
    },
  });

  useEffect(() => {
    if (profileData?.user) {
      const user = profileData.user;
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        businessName: user.businessName || "",
        businessType: user.businessType || "",
        businessAddress: user.businessAddress || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        country: user.country || "",
        taxId: user.taxId || "",
        website: user.website || "",
        description: user.description || "",
        socialMedia: {
          facebook: user.socialMedia?.facebook || "",
          twitter: user.socialMedia?.twitter || "",
          instagram: user.socialMedia?.instagram || ""
        },
        avatar: user.avatar || ""
      });
    }
  }, [profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialMedia.')) {
      const socialField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Please upload a valid image file (JPEG, PNG, or WebP)');
        setTimeout(() => setErrorMessage(""), 5000);
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB');
        setTimeout(() => setErrorMessage(""), 5000);
        return;
      }
      
      imageUploadMutation.mutate(file);
    }
  };

  const handleCancel = () => {
    if (profileData?.user) {
      const user = profileData.user;
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        businessName: user.businessName || "",
        businessType: user.businessType || "",
        businessAddress: user.businessAddress || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        country: user.country || "",
        taxId: user.taxId || "",
        website: user.website || "",
        description: user.description || "",
        socialMedia: {
          facebook: user.socialMedia?.facebook || "",
          twitter: user.socialMedia?.twitter || "",
          instagram: user.socialMedia?.instagram || ""
        },
        avatar: user.avatar || ""
      });
    }
    setIsEditing(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-red-500 text-center py-8">Error loading profile: {error.message}</div>;

  const user = profileData?.user;
  const completionPercentage = user?.completionPercentage || 0;
  const stats = user?.stats || {};

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={formData.avatar || "/api/placeholder/120/120"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-upload"
                disabled={imageUploadMutation.isPending}
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 cursor-pointer disabled:opacity-50"
              >
                {imageUploadMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CiCamera size={16} />
                )}
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user?.name || 'Your Name'}</h1>
              <p className="text-gray-600">{user?.businessName || 'Business Name'}</p>
              <div className="flex items-center gap-2 mt-1">
                {user?.verified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <FaCheck className="text-green-500" />
                    Verified Seller
                  </span>
                ) : (
                  <span className="text-amber-600 text-sm">Pending Verification</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <CiEdit /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Profile Completion</span>
            <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          {completionPercentage < 100 && (
            <p className="text-sm text-gray-600 mt-1">
              Complete your profile to improve customer trust and visibility
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CiUser className="text-blue-500" />
              Personal Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBuilding className="text-blue-500" />
              Business Information
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">Select Business Type</option>
                    <option value="Individual">Individual</option>
                    <option value="Small Business">Small Business</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLC">LLC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="4"
                  placeholder="Describe your business, products, and services..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-500" />
              Business Address
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CiGlobe className="text-blue-500" />
              Social Media
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaFacebook className="text-blue-600" />
                  Facebook
                </label>
                <input
                  type="url"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaTwitter className="text-blue-400" />
                  Twitter
                </label>
                <input
                  type="url"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://twitter.com/youraccount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaInstagram className="text-pink-500" />
                  Instagram
                </label>
                <input
                  type="url"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://instagram.com/youraccount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Statistics & Info */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CiStar className="text-blue-500" />
              Performance Stats
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Total Auctions</span>
                <span className="text-lg font-bold text-blue-600">{stats.totalAuctions || 0}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Active Auctions</span>
                <span className="text-lg font-bold text-green-600">{stats.activeAuctions || 0}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Completed Auctions</span>
                <span className="text-lg font-bold text-purple-600">{stats.completedAuctions || 0}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Average Rating</span>
                <span className="text-lg font-bold text-yellow-600">
                  {stats.avgRating ? `${stats.avgRating}/5` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Total Reviews</span>
                <span className="text-lg font-bold text-gray-600">{stats.totalReviews || 0}</span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Status</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Type</span>
                <span className="text-sm font-medium text-blue-600">Seller</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verification Status</span>
                <span className={`text-sm font-medium ${user?.verified ? 'text-green-600' : 'text-amber-600'}`}>
                  {user?.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-600">
                  {user?.signupAt ? new Date(user.signupAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium text-gray-600">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            
            {!user?.verified && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Complete your profile and verify your identity to build customer trust and unlock all features.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}