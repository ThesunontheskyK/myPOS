import { useState } from 'react'; // เพิ่ม useState
import './App.css';
import { usePos } from './hooks/usePos';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Dashboard from './components/Dashboard'; // Import มาใหม่

function App() {
  const { products, cart, addToCart, removeFromCart, calculateTotal, handleCheckout, formatCurrency } = usePos();
  
  // สร้าง State สำหรับสลับหน้า (default เป็น 'pos')
  const [currentTab, setCurrentTab] = useState('pos');

  return (
    <div className="app-container">
      {/* แถบเมนูข้างบน */}
      <nav className="navbar">
        <h1>🍵 My POS Shop</h1>
        <div className="menu-buttons">
          <button 
            className={currentTab === 'pos' ? 'active' : ''} 
            onClick={() => setCurrentTab('pos')}
          >
            หน้าขาย
          </button>
          <button 
            className={currentTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setCurrentTab('dashboard')}
          >
            แดชบอร์ด
          </button>
        </div>
      </nav>

      {/* ส่วนเนื้อหาที่จะเปลี่ยนไปตาม Tab */}
      <div className="content">
        {currentTab === 'pos' ? (
          <div className="pos-container">
            <ProductList 
              products={products} 
              addToCart={addToCart} 
              formatCurrency={formatCurrency} 
            />
            <Cart 
              cart={cart} 
              removeFromCart={removeFromCart} 
              calculateTotal={calculateTotal} 
              handleCheckout={handleCheckout} 
              formatCurrency={formatCurrency} 
            />
          </div>
        ) : (
          <Dashboard formatCurrency={formatCurrency} />
        )}
      </div>
    </div>
  );
}

export default App;