// src/api/clients.ts
const API_URL = "http://localhost:3000/api";

// Tipado del cliente
export interface Client {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Obtener todos los clientes
export async function getClients(): Promise<Client[]> {
  const res = await fetch(`${API_URL}/clients`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
}

// Obtener un cliente por ID
export async function getClientById(id: number): Promise<Client> {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener cliente");
  return res.json();
}

// Crear un nuevo cliente
export async function createClient(client: Client): Promise<Client> {
  const res = await fetch(`${API_URL}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error("Error al crear cliente");
  return res.json();
}

// Actualizar cliente
export async function updateClient(id: number, client: Client): Promise<Client> {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error("Error al actualizar cliente");
  return res.json();
}

// Eliminar cliente
export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al eliminar cliente");
}
