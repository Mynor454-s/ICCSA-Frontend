// src/api/payments.ts
import axios from "axios";
import type {
  Payment,
  PaymentSummary,
  DeliveryEligibility,
  PaymentListResponse,
  PaymentSummaryReport,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentResponse,
  QuotePaymentsResponse,
} from "../types/payment.types";

const API_URL = "http://localhost:3000/api";

// Función para obtener el token del sessionStorage
const getAuthHeader = () => {
  const token = sessionStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Crear un nuevo pago
export async function createPayment(payload: CreatePaymentRequest): Promise<PaymentResponse> {
  try {
    const response = await axios.post(`${API_URL}/payments`, payload, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error("Error creating payment:", error);
    throw error.response?.data || error;
  }
}

// Obtener todos los pagos (administrativo)
export async function getAllPayments(params?: {
  page?: number;
  pageSize?: number;
  quoteId?: number;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaymentListResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    if (params?.quoteId) queryParams.append("quoteId", params.quoteId.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.paymentMethod) queryParams.append("paymentMethod", params.paymentMethod);
    if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryParams.append("dateTo", params.dateTo);

    const url = `${API_URL}/payments${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await axios.get(url, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    throw error.response?.data || error;
  }
}

// Obtener resumen de pagos por período
export async function getPaymentsSummary(startDate: string, endDate: string): Promise<PaymentSummaryReport> {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await axios.get(`${API_URL}/payments/summary?${params}`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error("Error fetching payments summary:", error);
    throw error.response?.data || error;
  }
}

// Obtener pagos de una cotización específica
export async function getPaymentsByQuote(quoteId: number): Promise<QuotePaymentsResponse> {
  try {
    const response = await axios.get(`${API_URL}/payments/quote/${quoteId}`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error("Error fetching quote payments:", error);
    throw error.response?.data || error;
  }
}

// Obtener un pago específico por ID
export async function getPaymentById(id: number): Promise<Payment> {
  try {
    const response = await axios.get(`${API_URL}/payments/${id}`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error("Error fetching payment by ID:", error);
    throw error.response?.data || error;
  }
}

// Verificar elegibilidad para entrega
export async function checkDeliveryEligibility(quoteId: number): Promise<DeliveryEligibility> {
  try {
    const response = await axios.get(`${API_URL}/payments/quote/${quoteId}/delivery-check`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error("Error checking delivery eligibility:", error);
    throw error.response?.data || error;
  }
}

// Actualizar un pago (solo notas y referencia de transacción)
export async function updatePayment(id: number, updates: UpdatePaymentRequest): Promise<Payment> {
  try {
    const response = await axios.put(`${API_URL}/payments/${id}`, updates, getAuthHeader());
    return response.data.payment; // El backend devuelve { message, payment }
  } catch (error: any) {
    console.error("Error updating payment:", error);
    throw error.response?.data || error;
  }
}

// Eliminar un pago
export async function deletePayment(id: number): Promise<{ message: string }> {
  try {
    const response = await axios.delete(`${API_URL}/payments/${id}`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    throw error.response?.data || error;
  }
}

// Funciones auxiliares para formateo y validación

// Validar datos de pago antes de enviar
export function validatePaymentData(payment: CreatePaymentRequest): string[] {
  const errors: string[] = [];

  if (!payment.quoteId || payment.quoteId <= 0) {
    errors.push("ID de cotización es requerido y debe ser válido");
  }

  if (!payment.amount || payment.amount <= 0) {
    errors.push("El monto debe ser mayor a 0");
  }

  if (!payment.paymentMethod || payment.paymentMethod.trim() === '') {
    errors.push("Método de pago es requerido");
  }

  // Validar métodos de pago permitidos
  const validMethods = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE'];
  if (payment.paymentMethod && !validMethods.includes(payment.paymentMethod)) {
    errors.push("Método de pago no válido");
  }

  return errors;
}

// Validar rango de fechas para reportes
export function validateDateRange(startDate: string, endDate: string): string[] {
  const errors: string[] = [];
  
  if (!startDate || !endDate) {
    errors.push("Fecha de inicio y fin son requeridas");
    return errors;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    errors.push("Formato de fecha inválido. Use YYYY-MM-DD");
  }

  if (start > end) {
    errors.push("La fecha de inicio debe ser anterior a la fecha de fin");
  }

  // Validar que no sea un rango muy amplio (más de 1 año)
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYear) {
    errors.push("El rango de fechas no puede ser mayor a 1 año");
  }

  return errors;
}

// Formatear parámetros de consulta para la API
export function formatPaymentFilters(filters: any) {
  const formatted: any = {};

  if (filters.page && filters.page > 0) {
    formatted.page = parseInt(filters.page);
  }

  if (filters.pageSize && filters.pageSize > 0) {
    formatted.pageSize = Math.min(parseInt(filters.pageSize), 100); // Máximo 100 por página
  }

  if (filters.quoteId && filters.quoteId > 0) {
    formatted.quoteId = parseInt(filters.quoteId);
  }

  if (filters.status && filters.status.trim() !== '') {
    formatted.status = filters.status.trim().toUpperCase();
  }

  if (filters.paymentMethod && filters.paymentMethod.trim() !== '') {
    formatted.paymentMethod = filters.paymentMethod.trim().toUpperCase();
  }

  if (filters.dateFrom) {
    formatted.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    formatted.dateTo = filters.dateTo;
  }

  return formatted;
}

// Calcular estadísticas de pagos
export function calculatePaymentStats(payments: Payment[]) {
  if (!Array.isArray(payments) || payments.length === 0) {
    return {
      totalAmount: 0,
      count: 0,
      averageAmount: 0,
      byMethod: {},
      byType: {}
    };
  }

  const stats = {
    totalAmount: 0,
    count: payments.length,
    averageAmount: 0,
    byMethod: {} as Record<string, { count: number; total: number }>,
    byType: {} as Record<string, { count: number; total: number }>
  };

  payments.forEach(payment => {
    const amount = typeof payment.amount === 'string' 
      ? parseFloat(payment.amount) 
      : payment.amount;

    stats.totalAmount += amount;

    // Por método
    if (!stats.byMethod[payment.paymentMethod]) {
      stats.byMethod[payment.paymentMethod] = { count: 0, total: 0 };
    }
    stats.byMethod[payment.paymentMethod].count++;
    stats.byMethod[payment.paymentMethod].total += amount;

    // Por tipo
    if (!stats.byType[payment.paymentType]) {
      stats.byType[payment.paymentType] = { count: 0, total: 0 };
    }
    stats.byType[payment.paymentType].count++;
    stats.byType[payment.paymentType].total += amount;
  });

  stats.averageAmount = stats.totalAmount / stats.count;

  return stats;
}
