import React, { useState, useEffect } from 'react';
import { Button, Table, Card, Row, Col, Form, Badge, Alert, Pagination, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getAllPayments, getPaymentsSummary, deletePayment } from '../api/payments';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../types/payment.types';
import type { Payment, PaymentListResponse, PaymentSummaryReport } from '../types/payment.types';

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState<PaymentListResponse | null>(null);
  const [summary, setSummary] = useState<PaymentSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, [filters]);

  useEffect(() => {
    // Cargar resumen del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    loadSummary(
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cleanFilters = { ...filters };
      if (!cleanFilters.status) delete cleanFilters.status;
      if (!cleanFilters.paymentMethod) delete cleanFilters.paymentMethod;
      if (!cleanFilters.dateFrom) delete cleanFilters.dateFrom;
      if (!cleanFilters.dateTo) delete cleanFilters.dateTo;

      const data = await getAllPayments(cleanFilters);
      setPayments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando pagos');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (startDate: string, endDate: string) => {
    try {
      const data = await getPaymentsSummary(startDate, endDate);
      setSummary(data);
    } catch (err) {
      console.error('Error cargando resumen:', err);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value // Reset page when changing other filters
    }));
  };

  const handleDelete = async (payment: Payment) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;

    try {
      await deletePayment(paymentToDelete.id!);
      setShowDeleteModal(false);
      setPaymentToDelete(null);
      loadPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error eliminando pago');
      setShowDeleteModal(false);
    }
  };

  const getStatusVariant = (status: string) => {
    const statusConfig = PAYMENT_STATUS.find(s => s.value === status);
    return statusConfig?.variant || 'secondary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `Q${parseFloat(amount.toString()).toFixed(2)}`;
  };

  return (
    <div>
      {/* Navegación */}
      <div className="mb-3">
        <Link to="/dashboard" className="btn btn-secondary">
          <i className="bi bi-arrow-left"></i> Volver
        </Link>
      </div>

      <h2 className="mb-4">Administración de Pagos</h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      {/* Resumen del mes */}
      {summary && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-primary">{formatCurrency(summary.summary.totalAmount)}</h5>
                <small className="text-muted">Total del Mes</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-success">{summary.summary.count}</h5>
                <small className="text-muted">Pagos Registrados</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-info">{formatCurrency(summary.summary.averageAmount)}</h5>
                <small className="text-muted">Promedio por Pago</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-warning">{summary.period.daysInPeriod}</h5>
                <small className="text-muted">Días en el Período</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <h6>Filtros de Búsqueda</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {PAYMENT_STATUS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Método de Pago</Form.Label>
                <Form.Select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                >
                  <option value="">Todos los métodos</option>
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Fecha Desde</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Fecha Hasta</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Por página</Form.Label>
                <Form.Select
                  value={filters.pageSize}
                  onChange={(e) => handleFilterChange('pageSize', parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de pagos */}
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : payments ? (
        <>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6>Pagos Registrados</h6>
              <div>
                Total en página: {formatCurrency(payments.pagination.pageTotal)}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive striped>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cotización</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Referencia</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>#{payment.id}</td>
                      <td>
                        <Link to={`/dashboard/cotizaciones?id=${payment.quoteId}`}>
                          #{payment.quoteId}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <strong>{payment.Quote?.Client.name}</strong>
                          <br/>
                          <small className="text-muted">{payment.Quote?.Client.email}</small>
                        </div>
                      </td>
                      <td className="text-end">
                        <strong>{formatCurrency(payment.amount)}</strong>
                        <br/>
                        <Badge bg={payment.paymentType === 'COMPLETO' ? 'success' : 'warning'}>
                          {payment.paymentType}
                        </Badge>
                      </td>
                      <td>{PAYMENT_METHODS.find(m => m.value === payment.paymentMethod)?.label}</td>
                      <td>
                        <Badge bg={getStatusVariant(payment.status)}>
                          {PAYMENT_STATUS.find(s => s.value === payment.status)?.label}
                        </Badge>
                      </td>
                      <td>{formatDate(payment.paymentDate!)}</td>
                      <td>
                        <small>{payment.transactionReference || '-'}</small>
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(payment)}
                          disabled={payment.Quote?.status === 'ENTREGADA'}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Paginación */}
          {payments.pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.First
                  disabled={payments.pagination.currentPage === 1}
                  onClick={() => handleFilterChange('page', 1)}
                />
                <Pagination.Prev
                  disabled={payments.pagination.currentPage === 1}
                  onClick={() => handleFilterChange('page', payments.pagination.currentPage - 1)}
                />
                
                {Array.from({ length: Math.min(5, payments.pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, payments.pagination.currentPage - 2) + i;
                  if (pageNum <= payments.pagination.totalPages) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === payments.pagination.currentPage}
                        onClick={() => handleFilterChange('page', pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  }
                  return null;
                })}
                
                <Pagination.Next
                  disabled={payments.pagination.currentPage === payments.pagination.totalPages}
                  onClick={() => handleFilterChange('page', payments.pagination.currentPage + 1)}
                />
                <Pagination.Last
                  disabled={payments.pagination.currentPage === payments.pagination.totalPages}
                  onClick={() => handleFilterChange('page', payments.pagination.totalPages)}
                />
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <Alert variant="info">No se encontraron pagos con los filtros aplicados.</Alert>
      )}

      {/* Modal de confirmación para eliminar */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar este pago de {formatCurrency(paymentToDelete?.amount || 0)}?
          <br/>
          <small className="text-muted">Esta acción no se puede deshacer.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}