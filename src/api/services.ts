const API_URL = "http://localhost:3000/api";

// Tipado del servicio
export interface Service {
  id?: number;
  name: string;
  description: string;
  price: number;
}

// Obtener todos los servicios
export async function getServices(): Promise<Service[]> {
  const res = await fetch(`${API_URL}/services`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener servicios");
  return res.json();
}

// Obtener un servicio por ID
export async function getServiceById(id: number): Promise<Service> {
  const res = await fetch(`${API_URL}/services/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener servicio");
  return res.json();
}

// Crear un nuevo servicio
export async function createService(service: Service): Promise<Service> {
  const res = await fetch(`${API_URL}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(service),
  });
  if (!res.ok) throw new Error("Error al crear servicio");
  return res.json();
}

// Actualizar servicio
export async function updateService(id: number, service: Service): Promise<Service> {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(service),
  });
  if (!res.ok) throw new Error("Error al actualizar servicio");
  return res.json();
}

// Eliminar servicio
export async function deleteService(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al eliminar servicio");
}