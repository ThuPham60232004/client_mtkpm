import axios from 'axios';

export const getReviews = async () => {
  try {
    const response = await axios.get('https://backend-hotel-oy0i.onrender.com/api/reviews/getAllReviewsclient');
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const createReview = async (reviewData) => {
  try {
    const response = await axios.post('https://backend-hotel-oy0i.onrender.com/api/reviews', reviewData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await axios.put(`https://backend-hotel-oy0i.onrender.com/api/reviews/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await axios.delete(`https://backend-hotel-oy0i.onrender.com/api/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
