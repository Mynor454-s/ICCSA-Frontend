// src/api/clients.ts
const API_URL = "http://localhost:3000/api";

// Tipado del material
export interface Material {
  id?: number;
  name: string;
  unit: string;
  unitCost: number;
}

// Obtener todos los materiales
export async function getMaterials(): Promise<Material[]> {
  const res = await fetch(`${API_URL}/materials`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener materiales");
  return res.json();
}

// Obtener un material por ID
export async function getMaterialById(id: number): Promise<Material> {
  const res = await fetch(`${API_URL}/materials/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener material");
  return res.json();
}

// Crear un nuevo material
export async function createMaterial(material: Material): Promise<Material> {
  const res = await fetch(`${API_URL}/materials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(material),
  });
  if (!res.ok) throw new Error("Error al crear material");
  return res.json();
}

// Actualizar material
export async function updateMaterial(id: number, material: Material): Promise<Material> {
  const res = await fetch(`${API_URL}/materials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(material),
  });
  if (!res.ok) throw new Error("Error al actualizar material");
  return res.json();
}

// Eliminar material
export async function deleteMaterial(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/materials/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al eliminar material");
}
