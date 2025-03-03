import axios from "axios";

const API_URL = "https://backend-hotel-oy0i.onrender.com/api/bookings";

export const getUserBookings = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/user/${userId}/history`);
    return response.data;
  } catch (error) {
    console.error("Lỗi lịch sử đặt chỗ", error);
    throw error;
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const response = await axios.put(`${API_URL}/${bookingId}/cancel`);
    return response.data;
  } catch (error) {
    console.error("Lỗi xoá booking", error);
    throw error;
  }
};
