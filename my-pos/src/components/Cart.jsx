import React, { useState } from 'react';
import PaymentModal from './PaymentModal';

export default function Cart({
    cart,
    removeFromCart,
    calculateTotal,
    handleCheckout,
    formatCurrency
}) {
    const total = calculateTotal();
    const [showQRModal, setShowQRModal] = useState(false);

    const handleQRPaymentSuccess = () => {
        handleCheckout('PROMPTPAY'); // ส่ง method ไปบอก backend ว่าจ่ายด้วย PromptPay
        setShowQRModal(false);
    };

    return (
        <div className="cart-section">
            <h2>🛒 ตะกร้าสินค้า</h2>

            {cart.length === 0 ? (
                <p className="empty-cart">ยังไม่มีสินค้าในรายการ</p>
            ) : (
                <div className="cart-items">
                    {cart.map((item) => (
                        <div key={item.id} className="cart-item">
                            <div className="item-info">
                                <span>{item.name}</span>
                                <small>x {item.qty}</small>
                            </div>
                            <div className="item-total">
                                {formatCurrency(item.price * item.qty)}
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => removeFromCart(item.id)}
                            >
                                ลบ
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="cart-summary">
                <div className="total-row">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="total-price">{formatCurrency(total)}</span>
                </div>
                <div className="payment-buttons">
                    <button
                        className="checkout-btn cash-btn"
                        disabled={cart.length === 0}
                        onClick={() => handleCheckout('CASH')}
                    >
                        💵 เงินสด
                    </button>

                    <button
                        className="checkout-btn qr-btn"
                        disabled={cart.length === 0}
                        onClick={() => setShowQRModal(true)}
                    >
                        📱 สแกนจ่าย
                    </button>
                </div>
            </div>

            {/* --- จุดที่แก้ไข: ต้องมีเงื่อนไข showQRModal && (...) --- */}
            {showQRModal && (
                <PaymentModal
                    total={total}
                    onClose={() => setShowQRModal(false)}
                    onConfirm={handleQRPaymentSuccess}
                />
            )}
            
        </div>
    );
}