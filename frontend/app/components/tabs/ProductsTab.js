export default function ProductsTab({ isAdmin, handleProduct, productForm, setProductForm, data, productQuery, setProductQuery, productOnlyStock, setProductOnlyStock, productStockOrder, setProductStockOrder, filteredProducts, stockByProduct, addProductToSaleCart, money, qty, setProductOnlyStockAndQuery }) {
  return (
    <>
      {isAdmin ? (
        <>
          <h2>Alta rapida de producto</h2>
          <form className="row" onSubmit={handleProduct}>
            <input required placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm((s) => ({ ...s, sku: e.target.value }))} />
            <input required placeholder="Nombre" value={productForm.name} onChange={(e) => setProductForm((s) => ({ ...s, name: e.target.value }))} />
            <select required value={productForm.brandId} onChange={(e) => setProductForm((s) => ({ ...s, brandId: e.target.value }))}><option value="">Marca</option>{data.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            <input type="number" min="0" step="0.01" placeholder="Costo" value={productForm.costPrice} onChange={(e) => setProductForm((s) => ({ ...s, costPrice: e.target.value }))} />
            <input type="number" min="0" step="0.01" placeholder="Precio venta" value={productForm.salePrice} onChange={(e) => setProductForm((s) => ({ ...s, salePrice: e.target.value }))} />
            <button type="submit">Crear</button>
          </form>
        </>
      ) : null}
      <h2 style={{ marginTop: 18 }}>Catalogo</h2>
      <div className="row" style={{ marginBottom: 10 }}>
        <input placeholder="Buscar por nombre o SKU" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={productOnlyStock} onChange={(e) => setProductOnlyStock(e.target.checked)} />Solo con stock</label>
        <select value={productStockOrder} onChange={(e) => setProductStockOrder(e.target.value)}><option value="none">Ordenar por stock</option><option value="asc">Stock ascendente</option><option value="desc">Stock descendente</option></select>
        <button type="button" className="secondary" onClick={setProductOnlyStockAndQuery}>Limpiar filtros</button>
      </div>
      <div className="tableWrap"><table><thead><tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Marca</th><th>Costo</th><th>Venta</th><th>Stock disponible</th><th>Activo</th><th>Accion</th></tr></thead><tbody>{filteredProducts.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.sku}</td><td>{p.name}</td><td>{data.brands.find((b) => b.id === p.brandId)?.name || "-"}</td><td>{money.format(Number(p.costPrice || 0))}</td><td>{money.format(Number(p.salePrice || 0))}</td><td>{qty.format(stockByProduct.get(p.id) || 0)}</td><td>{p.active ? "Si" : "No"}</td><td><button type="button" className="secondary" onClick={() => addProductToSaleCart(p)}>Agregar al carrito</button></td></tr>)}</tbody></table></div>
    </>
  );
}
