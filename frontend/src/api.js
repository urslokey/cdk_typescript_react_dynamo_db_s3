import axios from "axios";
const API_BASE_URL = "https://yc0gtn10g5.execute-api.us-east-1.amazonaws.com/prod";

export const getAllImages = async () => {
	try {
		const token = localStorage.getItem('token');
		const response = await axios.get(`${API_BASE_URL}/images`,{
			headers :{
				"Authorization":token,
				"Content-Type": "application/json",
			}
			});
		return response.data.images;
	} catch (error) {
		console.error("Error fetching images:", error);
		return [];
	}
};
