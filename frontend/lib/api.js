const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: mergedHeaders,
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(errorBody.message || 'Error de API');
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function authHeaders(token) {
  const headers = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const warehouseId = localStorage.getItem('comercio_pos_warehouse_id');
    if (warehouseId) {
      headers['x-pos-warehouse-id'] = warehouseId;
    }
  }
  return headers;
}

export async function getInitialData(token) {
  const endpoints = [
    '/products',
    '/brands',
    '/clients',
    '/suppliers',
    '/roles',
    '/users',
    '/warehouses',
    '/payment-methods',
    '/movement-types',
    '/movements',
    '/sales',
    '/purchases',
    '/sale-details',
    '/purchase-details',
    '/inventories',
    '/cashflows',
  ];

  const results = await Promise.all(endpoints.map((e) => request(e, { headers: authHeaders(token) }).catch(() => [])));

  return {
    products: results[0],
    brands: results[1],
    clients: results[2],
    suppliers: results[3],
    roles: results[4],
    users: results[5],
    warehouses: results[6],
    paymentMethods: results[7],
    movementTypes: results[8],
    movements: results[9],
    sales: results[10],
    purchases: results[11],
    saleDetails: results[12],
    purchaseDetails: results[13],
    inventories: results[14],
    cashflows: results[15],
  };
}

export async function getSaleById(id, token) {
  return request(`/sales/${id}`, {
    headers: authHeaders(token),
  });
}

export async function getPurchaseById(id, token) {
  return request(`/purchases/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createSale(payload, token) {
  return request('/sales', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createPurchase(payload, token) {
  return request('/purchases', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createProduct(payload, token) {
  return request('/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id, payload, token) {
  return request(`/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createClient(payload, token) {
  return request('/clients', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateClient(id, payload, token) {
  return request(`/clients/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createSupplier(payload, token) {
  return request('/suppliers', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateSupplier(id, payload, token) {
  return request(`/suppliers/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createUser(payload, token) {
  return request('/users', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload, token) {
  return request(`/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createWarehouse(payload, token) {
  return request('/warehouses', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateWarehouse(id, payload, token) {
  return request(`/warehouses/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function getMyCashSession(token) {
  return request('/cash-sessions/me', {
    headers: authHeaders(token),
  });
}

export async function openCashSession(payload, token) {
  return request('/cash-sessions/open', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function closeCashSession(payload, token) {
  return request('/cash-sessions/close', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function withdrawCashSession(payload, token) {
  return request('/cash-sessions/withdraw', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function createInventoryAdjustment(payload, token) {
  return request('/inventory-adjustments', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export { API_URL };
