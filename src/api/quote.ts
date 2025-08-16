const API_URL = "http://localhost:3000/api";

// Tipado para los materiales en items
export interface QuoteItemMaterial {
  materialId: number;
  quantity: number;
  unitPrice: number;
}

// Tipado para los items de la cotización
export interface QuoteItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  materials: QuoteItemMaterial[];
}

// Tipado para los servicios de la cotización
export interface QuoteService {
  serviceId: number;
  price: number;
}

// Tipado de la cotización
export interface Quote {
  id?: number;
  clientId: number;
  userId: number;
  deliveryDate: string;
  items: QuoteItem[];
  services: QuoteService[];
  totalAmount?: number;
  status?: string;
  qrCodeUrl?: string;  // ✅ Añadido
  createdAt?: string;
  updatedAt?: string;
}

// Tipado para actualizar status
export interface QuoteStatusUpdate {
  status: string;
}

// Tipado para QR info
export interface QuoteQRInfo {
  cotizacion_id: number;
  cliente: string;
  total: string;
  estado: string;
  fecha_entrega: string;
  fecha_creacion: string;
  qr_url: string;
}

// ✅ Nueva interfaz para la respuesta del listado
export interface QuotesListResponse {
  quotes: Array<{
    id: number;
    status: string;
    total: string;
    deliveryDate: string;
    qrCodeUrl?: string;
    createdAt: string;
    updatedAt: string;
    Client: {
      name: string;
      email: string;
    };
    User: {
      name: string;
    };
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuotes: number;
    quotesPerPage: number;
  };
}

// ✅ Parámetros para filtros
export interface QuotesFilters {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: number;
}

// Obtener una cotización por ID
export async function getQuoteById(id: number): Promise<Quote> {
  const res = await fetch(`${API_URL}/quotes/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener cotización");
  return res.json();
}

// Obtener información QR de cotización
export async function getQuoteQRInfo(id: number): Promise<QuoteQRInfo> {
  const res = await fetch(`${API_URL}/quotes/${id}/qr-info`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener información QR");
  return res.json();
}

// Crear una nueva cotización
export async function createQuote(quote: Quote): Promise<Quote> {
  const res = await fetch(`${API_URL}/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(quote),
  });
  if (!res.ok) throw new Error("Error al crear cotización");
  return res.json();
}

// Actualizar estado de cotización
export async function updateQuoteStatus(id: number, statusUpdate: QuoteStatusUpdate): Promise<Quote> {
  const res = await fetch(`${API_URL}/quotes/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(statusUpdate),
  });
  if (!res.ok) throw new Error("Error al actualizar estado de cotización");
  return res.json();
}

// ✅ Nueva función para obtener todas las cotizaciones
export async function getAllQuotes(filters?: QuotesFilters): Promise<QuotesListResponse> {
  const params = new URLSearchParams();
  
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.clientId) params.append('clientId', filters.clientId.toString());
  
  const url = `${API_URL}/quotes${params.toString() ? `?${params.toString()}` : ''}`;
  
  const res = await fetch(url, {
    credentials: "include",
  });
  
  if (!res.ok) throw new Error("Error al obtener cotizaciones");
  return res.json();
}