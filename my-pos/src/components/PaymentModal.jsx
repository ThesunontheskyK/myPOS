import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // <--- แก้ตรงนี้ 1 (เพิ่มปีกกา และใช้ QRCodeCanvas)

export default function PaymentModal({ total, onClose, onConfirm }) {
  const [qrCodePayload, setQrCodePayload] = useState('');

  useEffect(() => {
    fetch(`http://localhost:3000/generate-qr?amount=${total}`)
      .then(res => res.json())
      .then(data => setQrCodePayload(data.payload))
      .catch(err => console.error(err));
  }, [total]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>สแกนจ่าย PromptPay</h2>
        <div className="qr-container">
          {qrCodePayload ? (
            // <--- แก้ตรงนี้ 2 (เปลี่ยนชื่อ Component)
            <QRCodeCanvas value={qrCodePayload} size={250} />
          ) : (
            <p>กำลังสร้าง QR Code...</p>
          )}
        </div>
        
        <p className="total-text">ยอดชำระ: {total.toLocaleString()} บาท</p>
        <p className="instruction">กรุณาตรวจสอบสลิปโอนเงินก่อนกดยืนยัน</p>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>ยกเลิก</button>
          <button className="confirm-btn" onClick={onConfirm}>
            ยืนยันการโอนเงิน (ได้รับเงินแล้ว)
          </button>
        </div>
      </div>
    </div>
  );
}