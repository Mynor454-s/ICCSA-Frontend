import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { createPayment, updatePayment } from '../api/payments';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../types/payment.types';
import type { Payment, PaymentSummary, PaymentMethod, PaymentStatus } from '../types/payment.types';

interface PaymentFormModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  payment?: Payment | null;
  quoteId?: number;
  totalQuote?: number;
  paymentSummary?: PaymentSummary;
}

export default function PaymentFormModal({
  show,
  onHide,
  onSave,
  payment,
  quoteId,
  totalQuote = 0,
  paymentSummary
}: PaymentFormModalProps) {
  const [formData, setFormData] = useState<{
    amount: string;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    notes: string;
    status: PaymentStatus;
  }>({
    amount: '',
    paymentMethod: 'EFECTIVO',
    transactionReference: '',
    notes: '',
    status: 'CONFIRMADO'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: typeof payment.amount === 'string' ? payment.amount : payment.amount.toString(),
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference || '',
        notes: payment.notes || '',
        status: payment.status
      });
    } else {
      setFormData({
        amount: '',
        paymentMethod: 'EFECTIVO',
        transactionReference: '',
        notes: '',
        status: 'CONFIRMADO'
      });
    }
    setError(null);
  }, [payment, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(formData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        setError('El monto debe ser un número válido mayor a 0');
        return;
      }

      if (!payment && paymentSummary) {
        const remainingAmount = typeof paymentSummary.remainingAmount === 'string' 
          ? parseFloat(paymentSummary.remainingAmount)
          : paymentSummary.remainingAmount;
          
        if (amount > remainingAmount) {
          setError(`El monto no puede exceder Q${remainingAmount.toFixed(2)} (monto pendiente)`);
          return;
        }
      }

      if (payment) {
        // Actualizar pago existente (solo notas y referencia)
        await updatePayment(payment.id, {
          notes: formData.notes,
          transactionReference: formData.transactionReference
        });
      } else {
        // Crear nuevo pago
        if (!quoteId) {
          setError('ID de cotización requerido');
          return;
        }

        await createPayment({
          quoteId,
          amount,
          paymentMethod: formData.paymentMethod,
          transactionReference: formData.transactionReference,
          notes: formData.notes
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Error en pago:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al procesar el pago';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingAmount = () => {
    if (!paymentSummary) return totalQuote;
    
    const remaining = typeof paymentSummary.remainingAmount === 'string' 
      ? parseFloat(paymentSummary.remainingAmount)
      : paymentSummary.remainingAmount;
      
    return remaining;
  };

  const getTotalQuoteAmount = () => {
    if (!paymentSummary) return totalQuote;
    
    const total = typeof paymentSummary.totalQuote === 'string' 
      ? parseFloat(paymentSummary.totalQuote)
      : paymentSummary.totalQuote;
      
    return total;
  };

  const getTotalPaidAmount = () => {
    if (!paymentSummary) return 0;
    
    const paid = typeof paymentSummary.totalPaid === 'string' 
      ? parseFloat(paymentSummary.totalPaid)
      : paymentSummary.totalPaid;
      
    return paid;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const remainingAmount = getRemainingAmount();

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`bi ${payment ? 'bi-pencil' : 'bi-cash-coin'}`}></i>
          {payment ? ' Editar Pago' : ' Registrar Nuevo Pago'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="bi bi-exclamation-triangle"></i> {error}
            </Alert>
          )}
          
          {/* Resumen de la cotización */}
          {!payment && paymentSummary && (
            <Alert variant="info" className="mb-4">
              <h6 className="mb-3">
                <i className="bi bi-info-circle"></i> Resumen de la Cotización
              </h6>
              <Row>
                <Col md={4}>
                  <div className="text-center">
                    <strong className="text-primary">Total Cotización</strong>
                    <div className="fs-5">{formatCurrency(getTotalQuoteAmount())}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <strong className="text-success">Ya Pagado</strong>
                    <div className="fs-5">{formatCurrency(getTotalPaidAmount())}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <strong className="text-warning">Pendiente</strong>
                    <div className="fs-5">{formatCurrency(remainingAmount)}</div>
                  </div>
                </Col>
              </Row>
            </Alert>
          )}

          {/* Información del pago existente */}
          {payment && (
            <Alert variant="secondary" className="mb-4">
              <h6 className="mb-2">
                <i className="bi bi-receipt"></i> Información del Pago #{payment.id}
              </h6>
              <Row>
                <Col md={6}>
                  <small><strong>Monto:</strong> {formatCurrency(
                    typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount
                  )}</small>
                </Col>
                <Col md={6}>
                  <small><strong>Método:</strong> {PAYMENT_METHODS.find(m => m.value === payment.paymentMethod)?.label}</small>
                </Col>
              </Row>
              <small className="text-muted">
                <i className="bi bi-info-circle"></i> Solo se pueden editar las notas y referencia de transacción
              </small>
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-cash-coin"></i> Monto *
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={!payment ? remainingAmount : undefined}
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  disabled={!!payment} // No permitir editar monto en pagos existentes
                />
                {!payment && remainingAmount > 0 && (
                  <Form.Text className="text-muted">
                    <i className="bi bi-info-circle"></i> Máximo disponible: {formatCurrency(remainingAmount)}
                  </Form.Text>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-credit-card"></i> Método de Pago *
                </Form.Label>
                <Form.Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  disabled={!!payment} // No permitir editar método en pagos existentes
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-hash"></i> Referencia de Transacción
            </Form.Label>
            <Form.Control
              type="text"
              name="transactionReference"
              value={formData.transactionReference}
              onChange={handleChange}
              placeholder="Número de transacción, cheque, etc."
              maxLength={100}
            />
            <Form.Text className="text-muted">
              Opcional. Útil para transferencias bancarias o números de cheque.
            </Form.Text>
          </Form.Group>

          {/* Campo de estado solo para edición */}
          {payment && (
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-check-circle"></i> Estado
              </Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {PAYMENT_STATUS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-journal-text"></i> Notas
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notas adicionales sobre el pago..."
              maxLength={500}
            />
            <Form.Text className="text-muted">
              Opcional. Información adicional sobre el pago.
            </Form.Text>
          </Form.Group>

          {/* Resumen del nuevo pago */}
          {!payment && formData.amount && (
            <Alert variant="success" className="mt-3">
              <h6 className="mb-2">
                <i className="bi bi-calculator"></i> Resumen del Nuevo Pago
              </h6>
              <Row>
                <Col md={6}>
                  <small>
                    <strong>Monto a pagar:</strong> {formatCurrency(parseFloat(formData.amount) || 0)}
                  </small>
                </Col>
                <Col md={6}>
                  <small>
                    <strong>Restante después del pago:</strong> {formatCurrency(remainingAmount - (parseFloat(formData.amount) || 0))}
                  </small>
                </Col>
              </Row>
              {(remainingAmount - (parseFloat(formData.amount) || 0)) <= 0 && (
                <div className="mt-2">
                  <i className="bi bi-check-circle text-success"></i>
                  <small className="text-success ms-1">
                    <strong>¡Este pago completará la cotización!</strong>
                  </small>
                </div>
              )}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            <i className="bi bi-x"></i> Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Procesando...
              </>
            ) : (
              <>
                <i className={`bi ${payment ? 'bi-check' : 'bi-save'}`}></i>
                {payment ? ' Actualizar' : ' Registrar Pago'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}