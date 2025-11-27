import React, { useState, useEffect } from 'react';

export default function ProductManagement({ formatCurrency }) {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // ถ้าเป็น null คือโหมดเพิ่มใหม่

  // Form State
  const [formData, setFormData] = useState({
    name: '', barcode: '', price: '', stock: '', image_url: ''
  });

  // โหลดข้อมูล
  const fetchProducts = () => {
    fetch('http://localhost:3000/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // เปิด Modal (แยกกรณี เพิ่มใหม่ vs แก้ไข)
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', barcode: '', price: '', stock: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  // บันทึกข้อมูล (Create หรือ Update)
  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingProduct 
      ? `http://localhost:3000/products/${editingProduct.id}` 
      : 'http://localhost:3000/products';
    
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('บันทึกข้อมูลสำเร็จ');
        setIsModalOpen(false);
        fetchProducts(); // โหลดตารางใหม่
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  // ลบสินค้า
  const handleDelete = async (id) => {
    if (!confirm('ยืนยันที่จะลบสินค้านี้?')) return;

    try {
      const res = await fetch(`http://localhost:3000/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      alert('ลบไม่ได้ อาจมีประวัติการขายค้างอยู่');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📦 จัดการสินค้า</h2>
        <button className="checkout-btn" style={{ width: 'auto' }} onClick={() => openModal()}>
          + เพิ่มสินค้าใหม่
        </button>
      </div>

      <table className="product-table">
        <thead>
          <tr>
            <th>ชื่อสินค้า</th>
            <th>บาร์โค้ด</th>
            <th>ราคา</th>
            <th>สต็อก</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.barcode}</td>
              <td>{formatCurrency(p.price)}</td>
              <td>{p.stock}</td>
              <td>
                <button className="edit-btn" onClick={() => openModal(p)}>แก้ไข</button>
                <button className="delete-btn" onClick={() => handleDelete(p.id)}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>ชื่อสินค้า</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>บาร์โค้ด</label>
                <input 
                  type="text" 
                  required 
                  value={formData.barcode}
                  onChange={e => setFormData({...formData, barcode: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>ราคา</label>
                <input 
                  type="number" 
                  required 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>จำนวนสต็อก</label>
                <input 
                  type="number" 
                  required 
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="confirm-btn">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}