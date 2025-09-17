import axios from "axios";
const VITE_AUCTION_API = import.meta.env.VITE_AUCTION_API;


// getting list of all auction
export const getAuctions = async () => {
    try {
        const res = await axios.get(`${VITE_AUCTION_API}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.log("Error on getting auction data", error.message);
    }
}

// getting list of all auction
export const getMyAuctions = async () => {
    try {
        const res = await axios.get(`${VITE_AUCTION_API}/myauction`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.log("Error on getting my auction data", error.message);
    }
}


// getting single auction using _id
export const viewAuction = async (id) => {
    try {
        const res = await axios.get(`${VITE_AUCTION_API}/${id}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.log("Error on getting auction data", error.message);
    }
}

// placing bid for auction
export const placeBid = async ({ bidAmount, id }) => {
    try {
        const res = await axios.post(`${VITE_AUCTION_API}/${id}`,
            { bidAmount },
            { withCredentials: true }
        )
        return res.data;
    } catch (error) {
        console.log("Error placing bid", error.message);
    }
}


// creating new auction
export const createAuction = async (data) => {
    try {

        const formData = new FormData();
        formData.append("itemName", data.itemName);
        formData.append("startingPrice", data.startingPrice);
        formData.append("itemDescription", data.itemDescription);
        formData.append("itemCategory", data.itemCategory);
        formData.append("itemStartDate", data.itemStartDate);
        formData.append("itemEndDate", data.itemEndDate);
        
        // Append multiple images
        if (data.itemPhotos && data.itemPhotos.length > 0) {
            data.itemPhotos.forEach((photo) => {
                formData.append("itemPhotos", photo);
            });
        }

        const res = await axios.post(`${VITE_AUCTION_API}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true,
            }
        );
        return res.data;
    } catch (error) {
        console.error("Error creating auction:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        
        // Throw the error with more details for the UI to handle
        throw new Error(
            error.response?.data?.message || 
            error.response?.data?.error || 
            error.message || 
            "Failed to create auction"
        );
    }
}

// getting single auction using _id
export const dashboardStats = async () => {
    try {
        const res = await axios.get(`${VITE_AUCTION_API}/stats`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.log("Error on getting dashboard data", error.message);
    }
}