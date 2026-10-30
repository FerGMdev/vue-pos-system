import { apiRequest } from "./client";

export function listProducts() {
  return apiRequest("/products");
}

export function getProduct(id) {
  return apiRequest(`/products/${encodeURIComponent(id)}`);
}

export function createProduct(product) {
  return apiRequest("/products", {
    method: "POST",
    body: product,
    auth: true,
  });
}

export function updateProduct(id, product) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: product,
    auth: true,
  });
}

export function deleteProduct(id) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}
