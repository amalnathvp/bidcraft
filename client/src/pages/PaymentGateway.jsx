import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import LoadingScreen from '../components/LoadingScreen.jsx';

export const PaymentGateway = () => {
  const { id } = useParams(); // auction ID
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('payment'); // payment, processing, success
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });
  const [errors, setErrors] = useState({});

  // Get data from previous page
  const { auction, deliveryAddress, finalPrice } = location.state || {};

  useEffect(() => {
    // Redirect if no required data
    if (!auction || !deliveryAddress || !finalPrice) {
      navigate(`/auction/${id}`);
    }
  }, [auction, deliveryAddress, finalPrice, id, navigate]);

  if (!auction || !deliveryAddress || !finalPrice) {
    return <LoadingScreen />;
  }

  const totalPrice = (finalPrice * 1.08).toFixed(2); // Including tax

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length <= 19) { // 16 digits + 3 spaces
        setCardData(prev => ({ ...prev, [name]: formattedValue }));
      }
    }
    // Format expiry date
    else if (name === 'expiryDate') {
      const formattedValue = value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
      if (formattedValue.length <= 5) {
        setCardData(prev => ({ ...prev, [name]: formattedValue }));
      }
    }
    // CVV validation
    else if (name === 'cvv') {
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setCardData(prev => ({ ...prev, [name]: value }));
      }
    }
    else {
      setCardData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePayment = () => {
    const newErrors = {};
    
    if (paymentMethod === 'card') {
      if (!cardData.cardNumber.replace(/\s/g, '') || cardData.cardNumber.replace(/\s/g, '').length !== 16) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!cardData.expiryDate || cardData.expiryDate.length !== 5) {
        newErrors.expiryDate = 'Please enter expiry date (MM/YY)';
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        newErrors.cvv = 'Please enter CVV';
      }
      if (!cardData.cardHolder.trim()) {
        newErrors.cardHolder = 'Please enter cardholder name';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!validatePayment()) {
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate success (you could add random failure for realism)
    const isSuccess = Math.random() > 0.1; // 90% success rate
    
    if (isSuccess) {
      try {
        // Create order in database
        const orderData = {
          auctionId: auction._id,
          deliveryAddress: deliveryAddress,
          pricing: {
            purchasePrice: finalPrice,
            tax: finalPrice * 0.08,
            shipping: 0,
            totalAmount: parseFloat(totalPrice)
          },
          paymentDetails: {
            paymentMethod: paymentMethod,
            transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            paymentStatus: 'completed'
          }
        };

        const response = await fetch('/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Order created successfully:', result);
        } else {
          console.error('Failed to create order');
        }
      } catch (error) {
        console.error('Error creating order:', error);
      }
      
      setStep('success');
    } else {
      setStep('payment');
      setIsProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  const handleBackToAuctions = () => {
    navigate('/live-auctions');
  };

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please don't close this window...</p>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">💳 Processing ₹{totalPrice}</p>
            <p className="text-blue-600 text-xs mt-1">Secure payment in progress</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-700 mb-6">
              Congratulations! You have successfully purchased "{auction.itemName}"
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Order Details</h3>
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Order ID:</span>
                  <span className="text-green-900 font-mono">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Item:</span>
                  <span className="text-green-900">{auction.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Amount Paid:</span>
                  <span className="text-green-900 font-semibold">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Payment Method:</span>
                  <span className="text-green-900">
                    {paymentMethod === 'card' ? `Card ending in ${cardData.cardNumber.slice(-4)}` : 'PayPal'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Delivery Information</h3>
              <div className="text-left text-blue-700">
                <p className="font-medium">{deliveryAddress.fullName}</p>
                <p>{deliveryAddress.addressLine1}</p>
                {deliveryAddress.addressLine2 && <p>{deliveryAddress.addressLine2}</p>}
                <p>{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.postalCode}</p>
                <p>{deliveryAddress.country}</p>
                <p className="mt-2 text-blue-600">📧 {deliveryAddress.email}</p>
                <p className="text-blue-600">📱 {deliveryAddress.phone}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  📦 <strong>What's next?</strong><br />
                  You will receive an email confirmation shortly. The seller will contact you within 24 hours to arrange delivery.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleBackToAuctions}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate('/buyer/orders')}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  View My Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 p-2"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
              <p className="text-gray-600">Complete your purchase</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === 'card' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💳</div>
                      <p className="font-medium">Credit Card</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === 'paypal' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🅿️</div>
                      <p className="font-medium">PayPal</p>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
                {paymentMethod === 'card' ? (
                  <>
                    <div>
                      <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        id="cardHolder"
                        name="cardHolder"
                        value={cardData.cardHolder}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cardHolder ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.cardHolder && <p className="text-red-500 text-xs mt-1">{errors.cardHolder}</p>}
                    </div>

                    <div>
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={cardData.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234 5678 9012 3456"
                      />
                      {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          value={cardData.expiryDate}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="MM/YY"
                        />
                        {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                      </div>

                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                          CVV *
                        </label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={cardData.cvv}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.cvv ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="123"
                        />
                        {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-4">🅿️</div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">PayPal Payment</h3>
                    <p className="text-blue-700 mb-4">
                      You will be redirected to PayPal to complete your payment securely.
                    </p>
                    <p className="text-blue-600 text-sm">
                      Amount: ₹{totalPrice}
                    </p>
                  </div>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-lg"
                  >
                    {isProcessing ? 'Processing...' : `Pay ₹${totalPrice}`}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex items-center justify-center gap-4 text-gray-500 text-sm">
                <span>🔒 Secure Payment</span>
                <span>•</span>
                <span>256-bit SSL Encryption</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={auction.itemPhotos?.[0] || auction.itemPhoto || "https://picsum.photos/100"}
                    alt={auction.itemName}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{auction.itemName}</h3>
                    <p className="text-gray-600 text-xs">{auction.itemCategory}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Item Price</span>
                    <span className="text-gray-900">₹{finalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span className="text-gray-900">₹{(finalPrice * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₹{totalPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                  <div className="text-gray-700 text-sm">
                    <p className="font-medium">{deliveryAddress.fullName}</p>
                    <p>{deliveryAddress.addressLine1}</p>
                    {deliveryAddress.addressLine2 && <p>{deliveryAddress.addressLine2}</p>}
                    <p>{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.postalCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};