// Get buyer profile
export const getBuyerProfile = async () => {
  try {
    const response = await fetch('/api/buyer/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get buyer profile error:', error);
    console.error('Error response:', error);
    
    if (error.message || error.error) {
      throw error;
    } else {
      throw { message: 'Failed to load profile. Please try again.' };
    }
  }
};

// Update buyer profile
export const updateBuyerProfile = async (profileData) => {
  try {
    const response = await fetch('/api/buyer/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update buyer profile error:', error);
    throw error.response?.data || error;
  }
};

// Change buyer password
export const changeBuyerPassword = async (passwordData) => {
  try {
    const response = await fetch('/api/buyer/change-password', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Change buyer password error:', error);
    throw error.response?.data || error;
  }
};