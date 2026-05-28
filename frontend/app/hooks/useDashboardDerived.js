import { useMemo } from "react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sumTotal(rows, field = "total") {
  return rows.reduce((a, b) => a + Number(b[field] || 0), 0);
}

export default function useDashboardDerived({
  data,
  dashboardRange,
  cashSessionInfo,
  productQuery,
  productOnlyStock,
  productStockOrder,
  saleForm,
  purchaseForm,
}) {
  const metrics = useMemo(() => {
    const now = new Date();
    const todayDate = today();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now);
    startOf30Days.setDate(now.getDate() - 30);
    const startOf12Months = new Date(now);
    startOf12Months.setFullYear(now.getFullYear() - 1);

    function inRange(dateText) {
      if (dashboardRange === "all") return true;
      if (dashboardRange === "today") return String(dateText || "") === todayDate;
      const date = new Date(`${dateText}T00:00:00`);
      if (dashboardRange === "month") return date >= startOfMonth;
      if (dashboardRange === "30d") return date >= startOf30Days;
      if (dashboardRange === "12m") return date >= startOf12Months;
      return true;
    }

    const salesFiltered = data.sales.filter((s) => inRange(s.saleDate));
    const purchasesFiltered = data.purchases.filter((p) => inRange(p.purchaseDate));

    const salesTotal = sumTotal(salesFiltered);
    const purchasesTotal = sumTotal(purchasesFiltered);
    const stockTotal = data.inventories.reduce((acc, i) => acc + Number(i.stock || 0), 0);
    const cashBalance = cashSessionInfo.hasOpenSession ? Number(cashSessionInfo.summary?.expectedBalance || 0) : 0;

    return { salesTotal, purchasesTotal, stockTotal, cashBalance };
  }, [data, dashboardRange, cashSessionInfo]);

  const topProducts = useMemo(() => {
    const map = new Map();
    for (const i of data.inventories) {
      map.set(i.productId, (map.get(i.productId) || 0) + Number(i.stock || 0));
    }
    return [...map.entries()]
      .map(([productId, stock]) => ({
        productId,
        stock,
        product: data.products.find((p) => p.id === productId)?.name || `Producto ${productId}`,
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);
  }, [data]);

  const stockByProduct = useMemo(() => {
    const stockMap = new Map();
    for (const inv of data.inventories) {
      stockMap.set(inv.productId, (stockMap.get(inv.productId) || 0) + Number(inv.stock || 0));
    }
    return stockMap;
  }, [data.inventories]);

  const movementSummaryRows = useMemo(() => {
    const userById = new Map(data.users.map((u) => [u.id, u]));
    const warehouseById = new Map(data.warehouses.map((w) => [w.id, w]));
    const movementTypeById = new Map(data.movementTypes.map((mt) => [mt.id, mt]));
    const saleRows = data.sales.map((sale) => {
      const client = data.clients.find((c) => c.id === sale.clientId);
      const userName = userById.get(sale.userId)?.name || `Usuario ${sale.userId}`;
      const fromName = warehouseById.get(sale.warehouseId)?.name || `Deposito ${sale.warehouseId}`;
      const detailRows = data.saleDetails.filter((d) => d.saleId === sale.id).map((d) => {
        const product = data.products.find((p) => p.id === d.productId);
        return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitPrice || 0) };
      });
      return { id: `sale-${sale.id}`, typeName: "Venta", movementDate: sale.saleDate, userName, fromName, toName: "-", counterparty: client?.fullName || `Cliente ${sale.clientId}`, document: sale.invoiceNumber || `Venta ${sale.id}`, total: Number(sale.total || 0), detailRows };
    });

    const purchaseRows = data.purchases.map((purchase) => {
      const supplier = data.suppliers.find((s) => s.id === purchase.supplierId);
      const userName = userById.get(purchase.userId)?.name || `Usuario ${purchase.userId}`;
      const toName = warehouseById.get(purchase.warehouseId)?.name || `Deposito ${purchase.warehouseId}`;
      const detailRows = data.purchaseDetails.filter((d) => d.purchaseId === purchase.id).map((d) => {
        const product = data.products.find((p) => p.id === d.productId);
        return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitPrice || 0) };
      });
      return { id: `purchase-${purchase.id}`, typeName: "Compra", movementDate: purchase.purchaseDate, userName, fromName: "-", toName, counterparty: supplier?.businessName || `Proveedor ${purchase.supplierId}`, document: purchase.invoiceNumber || `Compra ${purchase.id}`, total: Number(purchase.total || 0), detailRows };
    });

    const adjustmentRows = data.movements
      .filter((m) => {
        const type = movementTypeById.get(m.movementTypeId);
        const code = String(type?.code || "").toUpperCase();
        const name = String(type?.name || "").toUpperCase();
        return code === "AJUSTE" || name === "AJUSTE";
      })
      .map((movement) => {
        const userName = userById.get(movement.userId)?.name || `Usuario ${movement.userId}`;
        const warehouseName = warehouseById.get(movement.warehouseFromId)?.name || warehouseById.get(movement.warehouseToId)?.name || "-";
        const detailRows = data.movementDetails
          .filter((d) => d.movementId === movement.id)
          .map((d) => {
            const product = data.products.find((p) => p.id === d.productId);
            return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitCost || 0) };
          });
        return { id: `adjustment-${movement.id}`, typeName: "Ajuste", movementDate: movement.movementDate, userName, fromName: warehouseName, toName: "-", counterparty: "-", document: movement.docNumber || `Ajuste ${movement.id}`, total: 0, detailRows };
      });

    return [...saleRows, ...purchaseRows, ...adjustmentRows].sort((a, b) => String(b.movementDate).localeCompare(String(a.movementDate)));
  }, [data]);

  const salesListRows = useMemo(() => {
    const clientById = new Map(data.clients.map((c) => [c.id, c]));
    const userById = new Map(data.users.map((u) => [u.id, u]));
    const warehouseById = new Map(data.warehouses.map((w) => [w.id, w]));
    return data.sales
      .map((sale) => {
        const client = clientById.get(sale.clientId);
        const user = userById.get(sale.userId);
        const warehouse = warehouseById.get(sale.warehouseId);
        const details = data.saleDetails.filter((d) => d.saleId === sale.id).map((d) => {
          const product = data.products.find((p) => p.id === d.productId);
          return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitPrice || 0) };
        });
        return { id: sale.id, saleDate: sale.saleDate, invoiceNumber: sale.invoiceNumber || `Venta ${sale.id}`, clientName: client?.fullName || `Cliente ${sale.clientId}`, userName: user?.name || `Usuario ${sale.userId}`, warehouseName: warehouse?.name || `Deposito ${sale.warehouseId}`, paymentMethodName: sale?.SalePayments?.[0]?.PaymentMethod?.name || "-", total: Number(sale.total || 0), details };
      })
      .sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate)));
  }, [data]);

  const purchasesListRows = useMemo(() => {
    const supplierById = new Map(data.suppliers.map((s) => [s.id, s]));
    const userById = new Map(data.users.map((u) => [u.id, u]));
    const warehouseById = new Map(data.warehouses.map((w) => [w.id, w]));
    return data.purchases
      .map((purchase) => {
        const supplier = supplierById.get(purchase.supplierId);
        const user = userById.get(purchase.userId);
        const warehouse = warehouseById.get(purchase.warehouseId);
        const details = data.purchaseDetails.filter((d) => d.purchaseId === purchase.id).map((d) => {
          const product = data.products.find((p) => p.id === d.productId);
          return { productName: product?.name || `Producto ${d.productId}`, quantity: Number(d.quantity || 0), unitPrice: Number(d.unitPrice || 0) };
        });
        return { id: purchase.id, purchaseDate: purchase.purchaseDate, invoiceNumber: purchase.invoiceNumber || `Compra ${purchase.id}`, supplierName: supplier?.businessName || `Proveedor ${purchase.supplierId}`, userName: user?.name || `Usuario ${purchase.userId}`, warehouseName: warehouse?.name || `Deposito ${purchase.warehouseId}`, paymentMethodName: purchase?.PaymentMethod?.name || "-", total: Number(purchase.total || 0), details };
      })
      .sort((a, b) => String(b.purchaseDate).localeCompare(String(a.purchaseDate)));
  }, [data]);

  const lowStockProducts = useMemo(() => {
    return data.products
      .map((p) => ({ id: p.id, name: p.name, stock: Number(stockByProduct.get(p.id) || 0) }))
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
  }, [data.products, stockByProduct]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    const rows = data.products.filter((p) => {
      const brandName = data.brands.find((b) => b.id === p.brandId)?.name || "";
      const matchesQuery = !q || String(p.name || "").toLowerCase().includes(q) || String(p.sku || "").toLowerCase().includes(q) || String(brandName).toLowerCase().includes(q);
      const stock = Number(stockByProduct.get(p.id) || 0);
      const matchesStock = productOnlyStock ? stock > 0 : true;
      return matchesQuery && matchesStock;
    });
    if (productStockOrder === "asc") rows.sort((a, b) => Number(stockByProduct.get(a.id) || 0) - Number(stockByProduct.get(b.id) || 0));
    else if (productStockOrder === "desc") rows.sort((a, b) => Number(stockByProduct.get(b.id) || 0) - Number(stockByProduct.get(a.id) || 0));
    return rows;
  }, [data.products, data.brands, productQuery, productOnlyStock, productStockOrder, stockByProduct]);

  const saleTotal = useMemo(
    () => saleForm.details.reduce((acc, d) => acc + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0),
    [saleForm.details]
  );
  const purchaseTotal = useMemo(
    () => purchaseForm.details.reduce((acc, d) => acc + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0),
    [purchaseForm.details]
  );

  const defaultConsumerClientId = useMemo(() => {
    const match = data.clients.find((c) => String(c.fullName || "").toLowerCase().includes("consumidor final"));
    return match ? String(match.id) : "";
  }, [data.clients]);

  return {
    metrics,
    topProducts,
    stockByProduct,
    movementSummaryRows,
    salesListRows,
    purchasesListRows,
    lowStockProducts,
    filteredProducts,
    saleTotal,
    purchaseTotal,
    defaultConsumerClientId,
  };
}
