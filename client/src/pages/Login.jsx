import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useSellerAuth } from "../contexts/SellerAuthContext.jsx";
import { Link } from "react-router";
import LoadingScreen from "../components/LoadingScreen";

const Login = () => {
  const navigate = useNavigate();
  const { seller, isAuthenticated, isLoading, login } = useSellerAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isError, setIsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seller login API call
  const loginSeller = async (loginData) => {
    console.log('Login attempt:', loginData);
    
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(loginData),
    });

    console.log('Login response status:', response.status);
    console.log('Login response headers:', response.headers);
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } else {
          const errorText = await response.text();
          console.log('Non-JSON error response:', errorText);
          errorMessage = errorText || errorMessage;
        }
      } catch (parseError) {
        console.log('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    // Handle successful response
    try {
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Login success data:', data);
        return data;
      } else {
        console.log('Non-JSON success response, checking text...');
        const text = await response.text();
        console.log('Response text:', text);
        
        if (text.trim() === '') {
          // Empty response - create a basic success response
          console.log('Empty response detected, creating default response');
          return { message: 'Login Successful', user: null };
        }
        
        // Try to parse as JSON anyway
        try {
          return JSON.parse(text);
        } catch {
          throw new Error('Server returned invalid response format');
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Server response could not be parsed: ' + parseError.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Login and get user data in response
      const response = await loginSeller(formData);
      console.log('Login response received:', response);
      
      if (response.user) {
        // Update the seller auth context with user data from login response
        login(response.user);
        navigate("/seller");
      } else {
        // If no user data in response, try to fetch it separately
        console.log('No user data in login response, fetching separately...');
        try {
          const userResponse = await fetch('/user', {
            method: 'GET',
            credentials: 'include',
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user) {
              login(userData.user);
              navigate("/seller");
            } else {
              throw new Error('No user data available');
            }
          } else {
            throw new Error('Failed to fetch user data after login');
          }
        } catch (fetchError) {
          console.error('Error fetching user data:', fetchError);
          throw new Error('Login succeeded but failed to get user information');
        }
      }
    } catch (error) {
      console.log("Login Failed", error);
      setIsError(error.message || "Login failed");
      setTimeout(() => {
        setIsError("");
      }, 10000);
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/seller");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-sm shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 mb-4 -mt-2 py-3 rounded-md">
                  {isError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-800 text-white py-2 px-4 rounded-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600">
              <Link to="#" className="hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-indigo-800 font-medium hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
