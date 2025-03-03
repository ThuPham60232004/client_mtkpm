import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SearchContext } from "../../../context/SearchContext";
import "./reserve.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { faPaypal, faCcVisa, faCcMastercard } from '@fortawesome/free-brands-svg-icons';

const getDatesInRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const date = new Date(start.getTime());
  const dates = [];

  while (date <= end) {
    dates.push(new Date(date).getTime());
    date.setDate(date.getDate() + 1);
  }

  return dates;
};

const Reserve = ({ setOpen, hotelId, roomId }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmountState, setDiscountAmountState] = useState(0);
  const { dates } = useContext(SearchContext);
  const [room, setRoom] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bookings, setBookings] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [updatedUserInfo, setUpdatedUserInfo] = useState({});

  const defaultStartDate = dates && dates[0] && dates[0].startDate ? new Date(dates[0].startDate) : new Date();
  const defaultEndDate = dates && dates[0] && dates[0].endDate ? new Date(dates[0].endDate) : new Date(new Date().setDate(new Date().getDate() + 1));
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [inQueue, setInQueue] = useState(false); 


  const navigate = useNavigate();
  const calculateDepositAmount = (totalPrice) => {
    return totalPrice * 0.2;
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`https://backend-hotel-oy0i.onrender.com/api/rooms/${roomId}`);
        setRoom(res.data);
        setSelectedRooms([res.data._id]);
      } catch (err) {
        console.error("Lấy thông tin phòng thất bại", err);
      }
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`https://backend-hotel-oy0i.onrender.com/api/bookings?hotel=${hotelId}`);
        setBookings(res.data);
      } catch (err) {
        console.error("Lấy thông tin đặt phòng thất bại", err);
      }
    };
    fetchBookings();
  }, [hotelId]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const res = await axios.get(`https://backend-hotel-oy0i.onrender.com/api/users/${userId}`);
          setUserInfo(res.data);
          setUpdatedUserInfo(res.data); 
        } catch (err) {
          console.error("Lấy thông tin người dùng thất bại", err);
        }
      }
    };
    fetchUserInfo();
  }, []);

  const handleDiscountCodeChange = (e) => {
    setDiscountCode(e.target.value);
  };

  const handleApplyDiscount = async () => {
    try {
      const res = await axios.post("https://backend-hotel-oy0i.onrender.com/api/discounts/apply", { code: discountCode });
      setDiscountAmountState(res.data.discountAmount);
    } catch (err) {
      console.error("Áp dụng mã giảm giá thất bại", err);
    }
  };

  const alldates = getDatesInRange(startDate, endDate);
  const numberOfBookingDays = alldates.length;

  const calculateTotalPriceDetails = () => {
    if (!room) return { totalPriceBeforeTax: 0, totalTax: 0, discountAmount: 0, finalTotalPrice: 0, depositAmount: 0 };

    let totalPriceBeforeTax = 0;
    let totalTax = 0;

    selectedRooms.forEach((roomId) => {
      if (room._id === roomId) {
        const discountPrice = room.discountPrice || room.price;
        const roomTotalBeforeTax = discountPrice * numberOfBookingDays;
        totalPriceBeforeTax += roomTotalBeforeTax;
      }
    });

    const totalPriceAfterDiscount = totalPriceBeforeTax;
    const taxRate = room.taxPrice || 100000;
    totalTax = totalPriceAfterDiscount + taxRate;

    const finalTotalPrice = totalPriceAfterDiscount + totalTax - discountAmountState;
    const depositAmount = calculateDepositAmount(finalTotalPrice);

    return {
      totalPriceBeforeTax,
      totalTax,
      discountAmount: discountAmountState,
      depositAmount,
      finalTotalPrice
    };
  };

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUserInfo((prev) => ({ ...prev, [name]: value })); 
  };

  const handleUpdateUserInfo = async () => {
    const userId = localStorage.getItem("userId");
    try {
      await axios.put(`https://backend-hotel-oy0i.onrender.com/api/users/${userId}`, updatedUserInfo);
      alert("Thông tin người dùng đã được cập nhật!");
      setUserInfo(updatedUserInfo); 
    } catch (err) {
      console.error("Cập nhật thông tin người dùng thất bại", err);
    }
  };

  const handleClick = async () => {
    setInQueue(true); // Đưa người dùng vào hàng đợi
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("authToken");

      if (!userId || !token) {
        console.error("Thiếu thông tin ID người dùng hoặc token trong localStorage.");
        return;
      }

      const hotelResponse = await axios.get(`https://backend-hotel-oy0i.onrender.com/api/hotels/find/${hotelId}`);
      const idAdmin = hotelResponse.data.idAdmin;

      const bookingData = {
        user: userId,
        hotel: hotelId,
        room: selectedRooms,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentMethod: paymentMethod,
        totalPrice: calculateTotalPriceDetails().finalTotalPrice,
        status: "pending",
        idAdmin: idAdmin,
      };

      await axios.post("https://backend-hotel-oy0i.onrender.com/api/bookings", bookingData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await axios.put(
        `https://backend-hotel-oy0i.onrender.com/api/rooms/${selectedRooms[0]}`,
        { availability: true },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Phản hồi cập nhật trạng thái phòng:", response.data);
      alert("Đặt phòng thành công và trạng thái phòng đã được cập nhật!");
      navigate("/TransferConfirmation", {
        state: {
          recipientName: "Admin",
          accountNumber: "123456789",
          bankName: "TPBank",
          content: `Thanh Toán ${room.title}`,
          method: paymentMethod,
          amount: calculateTotalPriceDetails().finalTotalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
          userName: userInfo.username,
        }
      });
      setOpen(false);
    } catch (err) {
      console.error("Đặt phòng hoặc cập nhật trạng thái phòng thất bại", err.response.data);
    } finally {
      setInQueue(false); 
    }
  };
  return (
    <div className="reserve">
      <div className="reserve-container">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="reserve-close"
          onClick={() => setOpen(false)}
        />
         {inQueue ? (
          <div className="queue-screen">
            <h2>Bạn đang trong hàng đợi...</h2>
            <p>Vui lòng chờ trong khi chúng tôi xử lý đặt phòng của bạn.</p>
            <div className="spinner"></div> 
          </div>
        ) : (
          <>
        <h1 className="reserve-title">Đặt Phòng</h1>
        {userInfo && (
          <div className="user-info">
            <h2>Thông tin người dùng</h2>
            <p>Tên người dùng: 
              <input
                type="text"
                name="username"
                value={updatedUserInfo.username}
                onChange={handleUserInfoChange}
              />
            </p>
            <p>Email: 
              <input
                type="email"
                name="email"
                value={updatedUserInfo.email}
                onChange={handleUserInfoChange}
              />
            </p>
            <p>Quốc gia: 
              <input
                type="text"
                name="country"
                value={updatedUserInfo.country}
                onChange={handleUserInfoChange}
              />
            </p>
            <p>Thành phố: 
              <input
                type="text"
                name="city"
                value={updatedUserInfo.city}
                onChange={handleUserInfoChange}
              />
            </p>
            <p>Số điện thoại: 
              <input
                type="text"
                name="phone"
                value={updatedUserInfo.phone}
                onChange={handleUserInfoChange}
              />
            </p>
            <p>CCCD: 
              <input
                type="text"
                name="CCCD"
                value={updatedUserInfo.CCCD}
                onChange={handleUserInfoChange}
              />
            </p>
            <button onClick={handleUpdateUserInfo}>Cập nhật thông tin</button>
          </div>
        )}
         <div className="reserve-discount">
          <h2>Nhập mã giảm giá</h2>
          <div className="discount-input">
            <input
              type="text"
              value={discountCode}
              onChange={handleDiscountCodeChange}
              placeholder="Mã giảm giá"
            />
            <button onClick={handleApplyDiscount}>Áp dụng</button>
          </div>
        </div>
        <br/><br/>
        <h2>Xác nhận ngày ở</h2>
        <div className="reserve-dates">
          <div>
            <label>Ngày bắt đầu</label>
            <DatePicker 
              selected={startDate} 
              onChange={(date) => setStartDate(date || new Date())} 
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div>
            <label>Ngày kết thúc</label>
            <DatePicker 
              selected={endDate} 
              onChange={(date) => setEndDate(date || new Date())} 
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>
        <br/>
        <div className="reserve-payment">
          <h2>Phương thức thanh toán</h2>
          <div className="payment-options">
            <label>
              <input
                type="radio"
                value="vnpay"
                checked={paymentMethod === "vnpay"}
                onChange={() => setPaymentMethod("vnpay")}
              />
              <FontAwesomeIcon icon={faCcVisa} /> VN Pay
            </label>
            <label>
              <input
                type="radio"
                value="paypal"
                checked={paymentMethod === "paypal"}
                onChange={() => setPaymentMethod("paypal")}
              />
              <FontAwesomeIcon icon={faPaypal} /> PayPal
            </label>
            <label>
              <input
                type="radio"
                value="Mastercard"
                checked={paymentMethod === "Mastercard"}
                onChange={() => setPaymentMethod("Mastercard")}
              />
              <FontAwesomeIcon icon={faCcMastercard} /> Thẻ Mastercard
            </label>
          </div>
        </div>
        <div className="reserve-summary">
          <h2>Tóm tắt đơn hàng</h2>
          {room && (
            <div className="reserve-room-info">
              <h3>Phòng: {room.title}</h3>
              <p>Số ngày đặt: {numberOfBookingDays}</p>
              <p>Giá phòng: {room.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
              <p>Giá phòng giảm: {room.discountPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
              <p>Thuế: {calculateTotalPriceDetails().totalTax.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
              <p>Tổng giá: {calculateTotalPriceDetails().finalTotalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
              <p>Đặt cọc: {calculateTotalPriceDetails().depositAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
            </div>
          )}
        </div>
        
       
        <button onClick={handleClick} className="reserve-button-booking">
          Đặt Ngay!
        </button>
        </>
        )}
      </div>
    </div>
  );
};

export default Reserve;
