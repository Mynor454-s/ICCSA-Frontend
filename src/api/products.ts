const API_URL = "http://localhost:3000/api";

// Tipado del producto
export interface Product {
  id?: number;
  name: string;
  description: string;
  basePrice: number;
}

// Obtener todos los productos
export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}

// Obtener un producto por ID
export async function getProductById(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener producto");
  return res.json();
}

// Crear un nuevo producto
export async function createProduct(product: Product): Promise<Product> {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Error al crear producto");
  return res.json();
}

// Actualizar producto
export async function updateProduct(id: number, product: Product): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Error al actualizar producto");
  return res.json();
}

// Eliminar producto
export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al eliminar producto");
}