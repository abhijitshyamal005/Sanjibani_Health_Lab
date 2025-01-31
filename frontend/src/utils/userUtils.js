import axios from "axios";

const API_URL = "http://localhost:5000/api/users/";

// Get user details from localStorage or fetch from database if not found
export const getUserDetails = async () => {
    try {
        const user = localStorage.getItem("user");
        if (user) {
            return JSON.parse(user);
        } else {
            // If user is not found in localStorage, fetch from DB
            const userId = localStorage.getItem("userId");
            if (userId) {
                const userFromDB = await fetchUserFromDB(userId);
                if (userFromDB) {
                    setUserDetails(userFromDB);  
                    return userFromDB;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error parsing or fetching user data:", error);
        return null;
    }
};

// Save user details to localStorage
export const setUserDetails = (userData) => {
    try {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userId", userData._id);  
    } catch (error) {
        console.error("Error saving user data to local storage:", error);
    }
};

// Remove user details from localStorage
export const removeUserDetails = () => {
    try {
        localStorage.removeItem("user");
        localStorage.removeItem("userId");  
    } catch (error) {
        console.error("Error removing user data from local storage:", error);
    }
};

// Fetch user data from the database using userId
export const fetchUserFromDB = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user data from database:", error.response?.data || error.message);
        return null;
    }
};
