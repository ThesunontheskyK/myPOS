import { useState } from 'react';
import './App.css';
import { usePos } from './hooks/usePos';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement'; // <--- 1. Import มา

function App() {
  const { products, cart, addToCart, removeFromCart, calculateTotal, handleCheckout, formatCurrency } = usePos();
  const [currentTab, setCurrentTab] = useState('pos');

  return (
    <div className="app-container">
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
          {/* 2. เพิ่มปุ่มเมนูจัดการสินค้า */}
          <button 
            className={currentTab === 'management' ? 'active' : ''} 
            onClick={() => setCurrentTab('management')}
          >
            จัดการสินค้า
          </button>
        </div>
      </nav>

      <div className="content">
        {currentTab === 'pos' && (
          <div className="pos-container">
            <ProductList products={products} addToCart={addToCart} formatCurrency={formatCurrency} />
            <Cart 
              cart={cart} 
              removeFromCart={removeFromCart} 
              calculateTotal={calculateTotal} 
              handleCheckout={handleCheckout} 
              formatCurrency={formatCurrency} 
            />
          </div>
        )}
        
        {currentTab === 'dashboard' && (
          <Dashboard formatCurrency={formatCurrency} />
        )}

        {/* 3. เพิ่มเงื่อนไขแสดงหน้าจัดการสินค้า */}
        {currentTab === 'management' && (
          <ProductManagement formatCurrency={formatCurrency} />
        )}
      </div>
    </div>
  );
}

export default App;