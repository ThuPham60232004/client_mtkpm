import axios from 'axios';

export const getHotels = async () => {
  try {
    const response = await axios.get('https://backend-hotel-oy0i.onrender.com/api/hotels/all/');
    return response.data;
  } catch (error) {
    console.error('Không thể lấy danh sách khách sạn:', error);
    throw error;
  }
};

export const getRooms = async (hotelId) => {
  try {
    const response = await axios.get(`https://backend-hotel-oy0i.onrender.com/api/rooms/hotel/${hotelId}`);
    return response.data;
  } catch (error) {
    console.error('Không thể lấy danh sách phòng:', error);
    throw error;
  }
};
