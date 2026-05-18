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
  return { Authorization: `Bearer ${token}` };
}

export async function getInitialData(token) {
  const endpoints = [
    '/products',
    '/brands',
    '/clients',
    '/suppliers',
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
    users: results[4],
    warehouses: results[5],
    paymentMethods: results[6],
    movementTypes: results[7],
    movements: results[8],
    sales: results[9],
    purchases: results[10],
    saleDetails: results[11],
    purchaseDetails: results[12],
    inventories: results[13],
    cashflows: results[14],
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

export { API_URL };
