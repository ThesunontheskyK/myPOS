import React from 'react';

export default function ProductList({ products, addToCart, formatCurrency }) {
  return (
    <div className="product-section">
      <h2>📦 รายการสินค้า</h2>
      <div className="product-grid">
        {products.map((product) => (
          <button
            key={product.id}
            className="product-card"
            onClick={() => addToCart(product)}
          >
            <h3>{product.name}</h3>
            <p>{formatCurrency(product.price)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}