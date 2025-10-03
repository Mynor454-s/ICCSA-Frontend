// src/types/payment.types.ts

// -------- Enums / Literales del backend --------
export type PaymentMethod =
  | "EFECTIVO"
  | "TARJETA_CREDITO"
  | "TARJETA_DEBITO"
  | "TRANSFERENCIA"
  | "CHEQUE"
  | "DEPOSITO"
  | "OTROS";

export type PaymentStatus = "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";

export type PaymentType = "PARCIAL" | "COMPLETO";

// -------- Entidades (según modelo Sequelize) --------
export interface Payment {
  id: number;
  quoteId: number;
  amount: number | string;         // El backend puede devolver string "500.00"
  paymentDate: string;             // ISO
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;        // NOMBRE EN BACKEND = paymentType
  status: PaymentStatus;           // default en backend: CONFIRMADO
  transactionReference?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// -------- Requests (lo que espera el backend) --------
export interface CreatePaymentRequest {
  quoteId: number;
  amount: number | string;
  paymentMethod: PaymentMethod;
  status?: PaymentStatus;          // Añadido para incluir status
  paymentDate?: string;            // opcional
  notes?: string;
  transactionReference?: string;
}

/**
 * El backend SOLO permite actualizar notas y referencia.
 * (status/amount/paymentMethod/paymentDate/paymentType NO se actualizan por este endpoint)
 */
export interface UpdatePaymentRequest {
  notes?: string;
  transactionReference?: string;
  status?: PaymentStatus;          // Añadido para permitir cambiar status
}

// -------- Summaries / Responses --------

// Usando PaymentSummary como alias para mantener compatibilidad
export interface PaymentSummary {
  totalQuote: number;
  totalPaid: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  paymentCount?: number;
}

// Mantenemos QuotePaymentSummary para compatibilidad con backend
export interface QuotePaymentSummary extends PaymentSummary {}

export interface QuotePaymentsResponse {
  payments: Payment[];
  summary: PaymentSummary;
}

export interface PaymentResponse {
  message: string;
  payment: Payment;
  paymentSummary: PaymentSummary;
}

export interface PaymentListResponse {
  payments: Payment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPayments: number;
    paymentsPerPage: number;
    pageTotal: string | number;
  };
  filters?: {
    quoteId?: number | null;
    status?: PaymentStatus | null;
    paymentMethod?: PaymentMethod | null;
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export interface PaymentSummaryReport {
  period: {
    startDate: string;
    endDate: string;
    daysInPeriod: number;
  };
  summary: {
    totalAmount: string | number;
    count: number;
    averageAmount: string | number;
  };
  breakdowns: {
    byPaymentMethod: Array<{
      method: PaymentMethod;
      count: number;
      totalAmount: string | number;
    }>;
    byDay: Array<{
      date: string;
      count: number;
      totalAmount: string | number;
    }>;
  };
}

export interface DeliveryEligibility {
  canDeliver: boolean;
  currentStatus: string;
  totalQuote: number;
  totalPaid: number;
  isFullyPaid: boolean;
  isAlreadyDelivered?: boolean; // ✅ Nueva propiedad opcional
  message: string;
}

// -------- Constantes para UI --------
export const PAYMENT_METHODS = [
  { value: "EFECTIVO" as const, label: "Efectivo" },
  { value: "TARJETA_CREDITO" as const, label: "Tarjeta de Crédito" },
  { value: "TARJETA_DEBITO" as const, label: "Tarjeta de Débito" },
  { value: "TRANSFERENCIA" as const, label: "Transferencia Bancaria" },
  { value: "CHEQUE" as const, label: "Cheque" },
  { value: "DEPOSITO" as const, label: "Depósito Bancario" },
  { value: "OTROS" as const, label: "Otros" }
];

export const PAYMENT_STATUS = [
  { value: "PENDIENTE" as const, label: "Pendiente", variant: "warning" },
  { value: "CONFIRMADO" as const, label: "Confirmado", variant: "success" },
  { value: "RECHAZADO" as const, label: "Rechazado", variant: "danger" }
];

export const PAYMENT_TYPES = [
  { value: "PARCIAL" as const, label: "Pago Parcial", variant: "info" },
  { value: "COMPLETO" as const, label: "Pago Completo", variant: "success" }
];
