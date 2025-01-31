import axios from "axios";

const API_URL = "http://localhost:5000/api/users/";

export const getUserDetails = async () => {
    try {
        // Attempt to retrieve user details from localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            // If user data exists in localStorage, parse and return it
            return JSON.parse(storedUser);
        } else {
            // If no user in localStorage, fetch from the database using userId
            const userId = localStorage.getItem("userId");
            if (userId) {
                // If userId is found in localStorage, attempt to fetch user data from DB
                const userFromDB = await fetchUserFromDB(userId);
                if (userFromDB) {
                    // Store the fetched user data in localStorage for future use
                    setUserDetails(userFromDB);
                    return userFromDB;
                }
            }
        }
        return null; // Return null if no user data found
    } catch (error) {
        console.error("Error parsing or fetching user data:", error);
        return null;
    }
};

// Save user details to localStorage
export const setUserDetails = (userData) => {
    try {
        if (userData && userData._id) {
            // Save the user data and userId to localStorage
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("userId", userData._id);
        } else {
            console.error("Invalid user data:", userData);
        }
    } catch (error) {
        console.error("Error saving user data to local storage:", error);
    }
};


// Remove user details from localStorage
export const removeUserDetails = () => {
    try {
        // Remove user data and userId from localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
    } catch (error) {
        console.error("Error removing user data from local storage:", error);
    }
};

// Fetch user data from the database using userId
export const fetchUserFromDB = async (userId) => {
    try {
        // Send a GET request to the API to fetch the user data based on userId
        const response = await axios.get(`${API_URL}${userId}`);
        return response.data; // Return the fetched data
    } catch (error) {
        // Log error and return null if the fetch fails
        console.error("Error fetching user data from database:", error.response?.data || error.message);
        return null;
    }
};
