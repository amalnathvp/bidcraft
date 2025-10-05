import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuction } from "../api/auction.js";
import { useRef } from "react";
import { useNavigate } from "react-router";

export const CreateAuction = () => {
  const fileInputRef = useRef();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    itemName: "",
    itemDescription: "",
    itemCategory: "",
    startingPrice: "",
    itemStartDate: "",
    itemEndDate: "",
    itemPhotos: [],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createAuction,
    onSuccess: (data) => {
      setFormData({
        itemName: "",
        itemDescription: "",
        itemCategory: "",
        startingPrice: "",
        itemStartDate: "",
        itemEndDate: "",
        itemPhotos: [],
      });
      setError("");
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      queryClient.invalidateQueries({ queryKey: ["allAuction"] });
      queryClient.invalidateQueries({ queryKey: ["myauctions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      navigate(`/auction/${data.newAuction._id}`);
    },
    onError: (error) => {
      console.error("Auction creation failed:", error);
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.error ||
                          "Failed to create auction. Please try again.";
      setError(errorMessage);
    },
  });

  const categories = [
    "Pottery & Ceramics",
    "Woodcraft & Carving",
    "Textiles & Weaving",
    "Metalwork & Jewelry",
    "Glass Art & Stained Glass",
    "Leather Craft",
    "Paper Craft & Origami",
    "Stone Carving & Sculpture",
    "Basketry & Wickerwork",
    "Embroidery & Needlework",
    "Calligraphy & Hand Lettering",
    "Traditional Paintings",
    "Handmade Dolls & Toys",
    "Mosaic Art",
    "Candle Making",
    "Soap Making",
    "Macrame & Fiber Arts",
    "Beadwork & Jewelry Making",
    "Hand-painted Items",
    "Traditional Crafts",
    "Other Handicrafts",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if total files exceed limit
    if (formData.itemPhotos.length + files.length > 5) {
      setError("You can upload maximum 5 images");
      return;
    }

    const validFiles = [];
    for (const file of files) {
      const fileSizeMB = file.size / (1024 * 1024);

      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return;
      }

      if (fileSizeMB > 5) {
        setError(`File ${file.name} size must be less than 5 MB.`);
        return;
      }

      validFiles.push(file);
    }

    setFormData((prev) => ({
      ...prev,
      itemPhotos: [...prev.itemPhotos, ...validFiles],
    }));
    setError("");
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      itemPhotos: prev.itemPhotos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Image is now optional - remove the requirement
    // if (!formData.itemPhoto) {
    //   setError("Please upload an image.");
    //   return;
    // }

    const start = new Date(formData.itemStartDate);
    const end = new Date(formData.itemEndDate);

    if (end <= start) {
      setError("End date must be after start date.");
      return;
    }

    // Clear any existing errors before submitting
    setError("");
    mutate(formData);
  };

  //   today date
  const today = new Date().toISOString().split("T")[0];

  //   today+15 days
  const maxStart = new Date();
  maxStart.setDate(maxStart.getDate() + 15);
  const maxStartDate = maxStart.toISOString().split("T")[0];

  //   max end date
  let maxEndDate = "";
  if (formData.itemStartDate) {
    const end = new Date(formData.itemStartDate);
    end.setDate(end.getDate() + 15);
    maxEndDate = end.toISOString().split("T")[0];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-md shadow-md border border-gray-200">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div>
                <label
                  htmlFor="itemName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Item Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the name of your item"
                  required
                />
              </div>

              {/* Item Description */}
              <div>
                <label
                  htmlFor="itemDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Item Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="itemDescription"
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  placeholder="Provide a detailed description of your item including condition, features, and any relevant information"
                  required
                />
              </div>

              {/* Category and Starting Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Category */}
                <div>
                  <label
                    htmlFor="itemCategory"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="itemCategory"
                    name="itemCategory"
                    value={formData.itemCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Starting Price */}
                <div>
                  <label
                    htmlFor="startingPrice"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Starting Price (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="startingPrice"
                    name="startingPrice"
                    value={formData.startingPrice}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                    required
                  />
                </div>
              </div>

              {/* Start and End Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label
                    htmlFor="itemStartDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Auction Start Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    id="itemStartDate"
                    name="itemStartDate"
                    min={today}
                    value={formData.itemStartDate}
                    max={maxStartDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label
                    htmlFor="itemEndDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Auction End Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    id="itemEndDate"
                    name="itemEndDate"
                    value={formData.itemEndDate}
                    onChange={handleInputChange}
                    min={formData.itemStartDate}
                    max={maxEndDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Item Photos */}
              <div>
                <label
                  htmlFor="itemPhotos"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Item Photos <span className="text-gray-500">(Optional - Max 5 images)</span>
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    id="itemPhotos"
                    name="itemPhotos"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    disabled={formData.itemPhotos.length >= 5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  
                  {formData.itemPhotos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-3">
                        Preview ({formData.itemPhotos.length}/5):
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {formData.itemPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover border border-gray-300 rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              ×
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {photo.name}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      {formData.itemPhotos.length < 5 && (
                        <p className="text-sm text-blue-600 mt-2">
                          You can add {5 - formData.itemPhotos.length} more image(s)
                        </p>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, itemPhotos: [] }));
                          fileInputRef.current.value = "";
                        }}
                        className="mt-3 text-sm text-red-600 hover:underline"
                      >
                        Remove All Images
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 sm:flex-none bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isPending ? "Creating Auction..." : "Create Auction"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <HelpSection />
      </main>
    </div>
  );
};

export const HelpSection = () => {
  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">
        Tips for Creating a Successful Auction
      </h3>
      <ul className="space-y-2 text-blue-800 text-sm">
        <li className="flex items-start">
          <span className="text-blue-600 mr-2">•</span>
          Use clear, high-quality photos that show your item from multiple
          angles
        </li>
        <li className="flex items-start">
          <span className="text-blue-600 mr-2">•</span>
          Write detailed descriptions including condition, dimensions, and any
          flaws
        </li>
        <li className="flex items-start">
          <span className="text-blue-600 mr-2">•</span>
          Set a reasonable starting price to attract bidders
        </li>
        <li className="flex items-start">
          <span className="text-blue-600 mr-2">•</span>
          Choose appropriate auction duration (3-7 days typically work best)
        </li>
        <li className="flex items-start">
          <span className="text-blue-600 mr-2">•</span>
          Select the most accurate category to help buyers find your item
        </li>
      </ul>
    </div>
  );
};
