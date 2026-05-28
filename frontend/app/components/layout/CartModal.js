export default function CartModal({ cartProductModal, setCartProductModal, closeAddToCartModal, confirmAddProductToSaleCart }) {
  if (!cartProductModal.open) return null;

  return (
    <div className="modalOverlay">
      <div className="panel section modalCard">
        <h2>Agregar al carrito</h2>
        <p className="label">Producto: <strong>{cartProductModal.product?.name}</strong></p>
        <div className="row">
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={cartProductModal.quantity}
            onChange={(e) => setCartProductModal((prev) => ({ ...prev, quantity: e.target.value }))}
          />
        </div>
        <div className="modalActions">
          <button type="button" className="secondary" onClick={closeAddToCartModal}>Cancelar</button>
          <button type="button" onClick={confirmAddProductToSaleCart}>Agregar</button>
        </div>
      </div>
    </div>
  );
}
