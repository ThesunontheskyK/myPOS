import { useState, useEffect } from 'react';

export const usePos = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // ดึงข้อมูลสินค้า
  useEffect(() => {
    fetch('http://localhost:3000/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error:', err));
  }, []);

  // เพิ่มสินค้า
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // ลบสินค้า
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  // คำนวณยอดรวม
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.qty, 0);
  };

  // จัดรูปแบบเงิน
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  // สั่งซื้อ (พร้อมสั่งพิมพ์)
  const handleCheckout = async (method = 'CASH') => {  
    const total = calculateTotal();
    try {
      // 1. บันทึกยอดขายลง Database
      const response = await fetch('http://localhost:3000/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          totalAmount: total,
          paymentMethod: method, 
        }),
      });

      if (response.ok) {
        const data = await response.json(); // รับค่า Order ID ที่เพิ่งสร้างจาก Server

        // 2. สั่งพิมพ์ใบเสร็จ (เรียก API จำลองการพิมพ์ที่เราเพิ่งทำ)
        // เราทำตรงนี้เพื่อให้แน่ใจว่าขายสำเร็จก่อนค่อยพิมพ์
        try {
            await fetch('http://localhost:3000/print-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: data.orderId, // ส่ง Order ID ไปพิมพ์ในบิล
                    cart: cart,
                    total: total,
                    paymentMethod: method
                })
            });
            console.log("ส่งคำสั่งพิมพ์เรียบร้อย");
        } catch (printErr) {
            console.error("สั่งพิมพ์ล้มเหลว:", printErr);
        }

        alert(`ชำระเงิน (${method}) และสั่งพิมพ์เรียบร้อย!`); 
        setCart([]);
        
        // หมายเหตุ: ถ้าอยากเห็น Log ใน Terminal ของ Server ชัดๆ 
        // อาจจะลอง Comment บรรทัด reload นี้ออกก่อนชั่วคราวครับ
        window.location.reload(); 
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกยอดขาย');
      }
    } catch (error) {
      console.error(error);
      alert('เชื่อมต่อ Server ไม่ได้');
    }
  };

  // ส่งค่าออกไปให้ Component อื่นใช้
  return {
    products,
    cart,
    addToCart,
    removeFromCart,
    calculateTotal,
    handleCheckout,
    formatCurrency,
  };
};