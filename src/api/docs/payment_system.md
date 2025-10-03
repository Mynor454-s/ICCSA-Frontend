# Sistema de Pagos Integrado - Gestión de Pedidos

## Descripción
Sistema completo de pagos integrado con cotizaciones que permite:
- ✅ Pagos parciales y completos
- ✅ Control automático de estados basado en pagos
- ✅ Validaciones para prevenir entregas sin pago completo
- ✅ Seguimiento detallado de historial de pagos

## Flujo de Estados y Pagos

### Estados de Cotización
```
CREADA → ACEPTADA → EN_PROCESO → FINALIZADA → PAGADA → ENTREGADA
```

### Reglas de Negocio

1. **CREADA**: Sin pagos registrados
2. **ACEPTADA**: Puede tener pagos parciales
3. **EN_PROCESO**: Trabajo en progreso, pagos parciales permitidos
4. **FINALIZADA**: Trabajo completado, listo para pago final
5. **PAGADA**: Pago completo recibido, listo para entrega
6. **ENTREGADA**: Solo si está en estado PAGADA y pago completo

### Validaciones Automáticas

- ❌ **No se puede marcar ENTREGADA** sin pago completo
- ❌ **No se puede regresar a CREADA** si ya hay pagos
- ❌ **No se puede marcar PAGADA** sin pago completo
- ✅ **Estado se actualiza automáticamente** al recibir pagos

## Endpoints de Pagos

### 1. Crear Pago
```
POST /api/payments
```

**Body:**
```json
{
  "quoteId": 1,
  "amount": 500.00,
  "paymentMethod": "TRANSFERENCIA",
  "transactionReference": "TRX123456",
  "notes": "Pago parcial del 50%"
}
```

**Respuesta:**
```json
{
  "message": "Pago registrado correctamente",
  "payment": {
    "id": 1,
    "quoteId": 1,
    "amount": "500.00",
    "paymentMethod": "TRANSFERENCIA",
    "paymentType": "PARCIAL",
    "transactionReference": "TRX123456",
    "status": "CONFIRMADO"
  },
  "paymentSummary": {
    "totalQuote": 1000.00,
    "totalPaid": 500.00,
    "remainingAmount": 500.00,
    "isFullyPaid": false
  }
}
```

### 2. Listar Todos los Pagos (Administrativo)
```
GET /api/payments
```

**Parámetros de consulta:**
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Pagos por página (default: 10)
- `quoteId` (opcional): Filtrar por ID de cotización
- `status` (opcional): Filtrar por estado (PENDIENTE/CONFIRMADO/RECHAZADO)
- `paymentMethod` (opcional): Filtrar por método de pago
- `dateFrom` (opcional): Fecha desde (YYYY-MM-DD)
- `dateTo` (opcional): Fecha hasta (YYYY-MM-DD)

**Ejemplos:**
```bash
# Todos los pagos paginados
GET /api/payments?page=1&pageSize=20

# Filtrar por método de pago
GET /api/payments?paymentMethod=TRANSFERENCIA

# Filtrar por período
GET /api/payments?dateFrom=2025-10-01&dateTo=2025-10-31

# Filtros combinados
GET /api/payments?status=CONFIRMADO&dateFrom=2025-10-01&pageSize=50
```

**Respuesta:**
```json
{
  "payments": [
    {
      "id": 1,
      "quoteId": 1,
      "amount": "500.00",
      "paymentMethod": "TRANSFERENCIA",
      "paymentType": "PARCIAL",
      "paymentDate": "2025-10-02T10:30:00.000Z",
      "transactionReference": "TRX123456",
      "status": "CONFIRMADO",
      "Quote": {
        "id": 1,
        "total": "1000.00",
        "status": "EN_PROCESO",
        "Client": {
          "name": "Juan Pérez",
          "email": "juan@example.com"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPayments": 47,
    "paymentsPerPage": 10,
    "pageTotal": "5000.00"
  },
  "filters": {
    "quoteId": null,
    "status": "CONFIRMADO",
    "paymentMethod": null,
    "dateFrom": "2025-10-01",
    "dateTo": "2025-10-31"
  }
}
```

### 3. Resumen de Pagos por Período
```
GET /api/payments/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Parámetros requeridos:**
- `startDate`: Fecha de inicio (YYYY-MM-DD)
- `endDate`: Fecha de fin (YYYY-MM-DD)

**Ejemplo:**
```bash
GET /api/payments/summary?startDate=2025-10-01&endDate=2025-10-31
```

**Respuesta:**
```json
{
  "period": {
    "startDate": "2025-10-01",
    "endDate": "2025-10-31",
    "daysInPeriod": 31
  },
  "summary": {
    "totalAmount": "15750.00",
    "count": 25,
    "averageAmount": "630.00"
  },
  "breakdowns": {
    "byPaymentMethod": [
      {
        "method": "TRANSFERENCIA",
        "count": 10,
        "totalAmount": "8500.00"
      },
      {
        "method": "EFECTIVO",
        "count": 8,
        "totalAmount": "4200.00"
      },
      {
        "method": "TARJETA_CREDITO",
        "count": 7,
        "totalAmount": "3050.00"
      }
    ],
    "byPaymentType": [
      {
        "type": "PARCIAL",
        "count": 18,
        "totalAmount": "9750.00"
      },
      {
        "type": "COMPLETO",
        "count": 7,
        "totalAmount": "6000.00"
      }
    ],
    "byDay": [
      {
        "date": "2025-10-01",
        "count": 2,
        "totalAmount": "1500.00"
      },
      {
        "date": "2025-10-02",
        "count": 3,
        "totalAmount": "2100.00"
      }
    ]
  }
}
```

### 4. Obtener Pagos de una Cotización
```
GET /api/payments/quote/{quoteId}
```

**Respuesta:**
```json
{
  "payments": [
    {
      "id": 1,
      "amount": "500.00",
      "paymentMethod": "TRANSFERENCIA",
      "paymentType": "PARCIAL",
      "paymentDate": "2025-10-02T10:30:00.000Z",
      "transactionReference": "TRX123456",
      "status": "CONFIRMADO"
    }
  ],
  "summary": {
    "totalQuote": 1000.00,
    "totalPaid": 500.00,
    "remainingAmount": 500.00,
    "isFullyPaid": false,
    "paymentCount": 1
  }
}
```

### 5. Verificar Elegibilidad para Entrega
```
GET /api/payments/quote/{quoteId}/delivery-check
```

**Respuesta:**
```json
{
  "canDeliver": false,
  "currentStatus": "FINALIZADA",
  "totalQuote": 1000.00,
  "totalPaid": 500.00,
  "isFullyPaid": false,
  "message": "Faltan $500.00 por pagar"
}
```

### 6. Actualizar Pago
```
PUT /api/payments/{id}
```

**Body:**
```json
{
  "notes": "Pago confirmado por banco",
  "transactionReference": "TRX123456-CONFIRMED"
}
```

### 7. Eliminar Pago
```
DELETE /api/payments/{id}
```
*Solo permitido si la cotización no está ENTREGADA*

## Endpoints de Cotizaciones (Actualizados)

### Actualizar Estado con Validaciones
```
PUT /api/quotes/{id}/status
```

**Body:**
```json
{
  "status": "ENTREGADA"
}
```

**Respuesta de Error (pago incompleto):**
```json
{
  "message": "No se puede marcar como ENTREGADA. Faltan $500.00 por pagar",
  "currentStatus": "FINALIZADA",
  "requestedStatus": "ENTREGADA",
  "paymentInfo": {
    "totalQuote": 1000.00,
    "totalPaid": 500.00,
    "remainingAmount": 500.00,
    "isFullyPaid": false
  }
}
```

## Métodos de Pago Disponibles

- **EFECTIVO**: Pago en efectivo
- **TARJETA_CREDITO**: Tarjeta de crédito
- **TARJETA_DEBITO**: Tarjeta de débito
- **TRANSFERENCIA**: Transferencia bancaria
- **CHEQUE**: Pago con cheque
- **DEPOSITO**: Depósito bancario
- **OTROS**: Otros métodos

## Tipos de Pago

- **PARCIAL**: Pago que no cubre el total
- **COMPLETO**: Pago que completa el total de la cotización

## Estados de Pago

- **PENDIENTE**: En espera de confirmación
- **CONFIRMADO**: Pago confirmado
- **RECHAZADO**: Pago rechazado

## Ejemplos de Uso

### Ejemplo 1: Flujo Completo de Pago

```javascript
// 1. Crear cotización (total: $1,000)
const quote = await createQuote({...});

// 2. Pago parcial del 30%
await createPayment({
  quoteId: quote.id,
  amount: 300,
  paymentMethod: "EFECTIVO"
});
// Estado automático: ACEPTADA

// 3. Pago parcial del 50%
await createPayment({
  quoteId: quote.id,
  amount: 500,
  paymentMethod: "TRANSFERENCIA"
});
// Total pagado: $800

// 4. Intentar entregar (fallará)
await updateQuoteStatus(quote.id, "ENTREGADA");
// Error: "Faltan $200.00 por pagar"

// 5. Pago final del 20%
await createPayment({
  quoteId: quote.id,
  amount: 200,
  paymentMethod: "TARJETA_CREDITO"
});
// Estado automático: PAGADA

// 6. Marcar como entregada (éxito)
await updateQuoteStatus(quote.id, "ENTREGADA");
// ✅ Estado actualizado correctamente
```

### Ejemplo 2: Verificación antes de Entrega

```javascript
// Verificar si se puede entregar
const eligibility = await checkDeliveryEligibility(quoteId);

if (eligibility.canDeliver) {
  await updateQuoteStatus(quoteId, "ENTREGADA");
  console.log("Cotización entregada exitosamente");
} else {
  console.log(`No se puede entregar: ${eligibility.message}`);
}
```

### Ejemplo 3: Reportes Administrativos

```javascript
// Obtener pagos del mes actual con filtros
const monthlyPayments = await fetch('/api/payments?' + new URLSearchParams({
  dateFrom: '2025-10-01',
  dateTo: '2025-10-31',
  status: 'CONFIRMADO',
  page: 1,
  pageSize: 50
}));

// Resumen financiero del mes
const monthlySummary = await fetch('/api/payments/summary?' + new URLSearchParams({
  startDate: '2025-10-01',
  endDate: '2025-10-31'
}));

console.log(`Total recaudado en octubre: $${monthlySummary.summary.totalAmount}`);
console.log(`Número de pagos: ${monthlySummary.summary.count}`);
```

### Ejemplo 4: Dashboard de Administración

```javascript
// Función para obtener datos del dashboard
async function getDashboardData() {
  // Pagos de hoy
  const today = new Date().toISOString().split('T')[0];
  const todaysPayments = await fetch(`/api/payments?dateFrom=${today}&dateTo=${today}`);
  
  // Resumen de la semana
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weeklySummary = await fetch(`/api/payments/summary?startDate=${weekAgo}&endDate=${today}`);
  
  // Pagos pendientes
  const pendingPayments = await fetch('/api/payments?status=PENDIENTE');
  
  return {
    todaysTotal: todaysPayments.pagination.pageTotal,
    weeklyTotal: weeklySummary.summary.totalAmount,
    pendingCount: pendingPayments.pagination.totalPayments
  };
}
```

### Ejemplo 5: Búsqueda Avanzada de Pagos

```javascript
// Buscar pagos específicos
async function searchPayments(filters) {
  const params = new URLSearchParams();
  
  if (filters.clientName) {
    // Nota: Necesitarías agregar este filtro al backend
    params.append('clientName', filters.clientName);
  }
  
  if (filters.amountMin) {
    params.append('amountMin', filters.amountMin);
  }
  
  if (filters.amountMax) {
    params.append('amountMax', filters.amountMax);
  }
  
  if (filters.paymentMethod) {
    params.append('paymentMethod', filters.paymentMethod);
  }
  
  if (filters.dateFrom) {
    params.append('dateFrom', filters.dateFrom);
  }
  
  if (filters.dateTo) {
    params.append('dateTo', filters.dateTo);
  }
  
  const response = await fetch(`/api/payments?${params}`);
  return response.json();
}

// Uso
const results = await searchPayments({
  paymentMethod: 'TRANSFERENCIA',
  amountMin: 100,
  dateFrom: '2025-10-01',
  dateTo: '2025-10-31'
});
```

## Validaciones Implementadas

### Al Crear Pago:
- ✅ Cotización existe
- ✅ Cotización no está ENTREGADA
- ✅ Monto no excede lo pendiente
- ✅ Monto mayor a $0.01

### Al Cambiar Estado:
- ✅ ENTREGADA requiere pago completo + estado PAGADA
- ✅ PAGADA requiere pago completo
- ✅ CREADA no puede tener pagos existentes

### Al Eliminar Pago:
- ✅ Cotización no debe estar ENTREGADA
- ✅ Recalcula estado automáticamente

## Beneficios del Sistema

1. **Control Total**: Imposible entregar sin pago completo
2. **Flexibilidad**: Permite pagos parciales durante el proceso
3. **Transparencia**: Historial completo de pagos
4. **Automatización**: Estados se actualizan automáticamente
5. **Validaciones**: Previene errores de flujo de negocio
6. **Auditabilidad**: Registro completo de transacciones

## Reportes y Consultas

### Pagos por Período
```sql
SELECT DATE(paymentDate) as fecha, SUM(amount) as total_dia
FROM payments 
WHERE paymentDate BETWEEN '2025-10-01' AND '2025-10-31'
GROUP BY DATE(paymentDate);
```

### Cotizaciones Pendientes de Pago
```sql
SELECT q.id, q.total, COALESCE(SUM(p.amount), 0) as pagado
FROM quotes q
LEFT JOIN payments p ON q.id = p.quoteId
WHERE q.status != 'ENTREGADA'
GROUP BY q.id
HAVING q.total > COALESCE(SUM(p.amount), 0);
```