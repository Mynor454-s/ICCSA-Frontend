import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Table, Card, Row, Col, Form, Badge, Alert, Pagination, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getAllPayments, getPaymentsSummary, deletePayment } from '../api/payments';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../types/payment.types';
import type { Payment, PaymentListResponse, PaymentSummaryReport } from '../types/payment.types';

// ✅ IMPORTS PARA GRÁFICAS
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// ✅ REGISTRAR COMPONENTES DE CHART.JS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
);

// ✅ Componente para reporte imprimible
const PrintablePaymentReport = ({ payments, summary, filters }: { 
  payments: PaymentListResponse, 
  summary: PaymentSummaryReport | null,
  filters: any 
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `Q${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const getReportTitle = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `Reporte de Pagos - Del ${filters.dateFrom} al ${filters.dateTo}`;
    }
    return 'Reporte de Pagos';
  };

  const getStatusCounts = () => {
    const counts = payments.payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const getMethodCounts = () => {
    const counts = payments.payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const statusCounts = getStatusCounts();
  const methodCounts = getMethodCounts();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
          {getReportTitle().toUpperCase()}
        </h1>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          Generado el: {new Date().toLocaleDateString('es-GT', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>

      {/* Resumen Ejecutivo */}
      {summary && (
        <div style={{ marginBottom: '30px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Resumen Ejecutivo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#007bff', margin: '0' }}>{formatCurrency(summary.summary.totalAmount)}</h4>
              <small>Total Recaudado</small>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#28a745', margin: '0' }}>{summary.summary.count}</h4>
              <small>Pagos Procesados</small>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#17a2b8', margin: '0' }}>{formatCurrency(summary.summary.averageAmount)}</h4>
              <small>Promedio por Pago</small>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#ffc107', margin: '0' }}>{summary.period.daysInPeriod}</h4>
              <small>Días del Período</small>
            </div>
          </div>
        </div>
      )}

      {/* Análisis por Estado y Método */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h4>Distribución por Estado</h4>
          <table style={{ width: '100%', border: '1px solid #ddd', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Estado</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(statusCounts).map(([status, count]) => (
                <tr key={status}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {PAYMENT_STATUS.find(s => s.value === status)?.label || status}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div>
          <h4>Distribución por Método</h4>
          <table style={{ width: '100%', border: '1px solid #ddd', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Método</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(methodCounts).map(([method, count]) => (
                <tr key={method}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {PAYMENT_METHODS.find(m => m.value === method)?.label || method}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de Pagos */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Detalle de Pagos</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Cotización</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Cliente</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Monto</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Método</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Estado</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {payments.payments.map((payment) => (
              <tr key={payment.id}>
                <td style={{ border: '1px solid #ddd', padding: '6px' }}>#{payment.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px' }}>#{payment.quoteId}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px' }}>{payment.Quote?.Client.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>
                  {formatCurrency(payment.amount)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                  {PAYMENT_METHODS.find(m => m.value === payment.paymentMethod)?.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                  {PAYMENT_STATUS.find(s => s.value === payment.status)?.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px' }}>{formatDate(payment.paymentDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen Final */}
      <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Total de registros: {payments.payments.length}</strong></p>
          <p><strong>Total en página: {formatCurrency(payments.pagination.pageTotal)}</strong></p>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE PARA GRÁFICAS
const PaymentCharts = ({ payments }: { payments: PaymentListResponse }) => {
  // Función para formatear moneda
  const formatCurrency = (amount: string | number) => {
    return `Q${parseFloat(amount.toString()).toFixed(2)}`;
  };

  // 📊 DATOS PARA GRÁFICA DE MÉTODOS DE PAGO (PIE)
  const getMethodData = () => {
    const methodCounts = payments.payments.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const methodAmounts = payments.payments.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      acc[method] = (acc[method] || 0) + parseFloat(payment.amount.toString());
      return acc;
    }, {} as Record<string, number>);

    return {
      counts: {
        labels: Object.keys(methodCounts).map(method => 
          PAYMENT_METHODS.find(m => m.value === method)?.label || method
        ),
        datasets: [{
          label: 'Cantidad de Pagos',
          data: Object.values(methodCounts),
          backgroundColor: [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      amounts: {
        labels: Object.keys(methodAmounts).map(method => 
          PAYMENT_METHODS.find(m => m.value === method)?.label || method
        ),
        datasets: [{
          label: 'Monto Total',
          data: Object.values(methodAmounts),
          backgroundColor: [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      }
    };
  };

  // 📈 DATOS PARA GRÁFICA DE ESTADOS (BAR)
  const getStatusData = () => {
    const statusCounts = payments.payments.reduce((acc, payment) => {
      const status = payment.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusAmounts = payments.payments.reduce((acc, payment) => {
      const status = payment.status;
      acc[status] = (acc[status] || 0) + parseFloat(payment.amount.toString());
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statusCounts).map(status => 
        PAYMENT_STATUS.find(s => s.value === status)?.label || status
      ),
      datasets: [
        {
          label: 'Cantidad de Pagos',
          data: Object.values(statusCounts),
          backgroundColor: '#007bff',
          borderColor: '#0056b3',
          borderWidth: 1
        },
        {
          label: 'Monto Total (Q)',
          data: Object.values(statusAmounts),
          backgroundColor: '#28a745',
          borderColor: '#1e7e34',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // 📅 DATOS PARA GRÁFICA DE TENDENCIA POR FECHA (LINE)
  const getTrendData = () => {
    // Agrupar pagos por fecha
    const dailyData = payments.payments.reduce((acc, payment) => {
      const date = new Date(payment.paymentDate!).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, amount: 0 };
      }
      acc[date].count += 1;
      acc[date].amount += parseFloat(payment.amount.toString());
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Ordenar fechas
    const sortedDates = Object.keys(dailyData).sort();
    
    return {
      labels: sortedDates.map(date => 
        new Date(date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Cantidad de Pagos',
          data: sortedDates.map(date => dailyData[date].count),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Monto Total (Q)',
          data: sortedDates.map(date => dailyData[date].amount),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // 💰 DATOS PARA GRÁFICA DE TIPOS DE PAGO (DOUGHNUT)
  const getPaymentTypeData = () => {
    const typeCounts = payments.payments.reduce((acc, payment) => {
      const type = payment.paymentType || 'PARCIAL';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(typeCounts).map(type => 
        type === 'COMPLETO' ? 'Pago Completo' : 'Pago Parcial'
      ),
      datasets: [{
        data: Object.values(typeCounts),
        backgroundColor: ['#28a745', '#ffc107'],
        borderWidth: 3,
        borderColor: '#fff'
      }]
    };
  };

  const methodData = getMethodData();
  const statusData = getStatusData();
  const trendData = getTrendData();
  const paymentTypeData = getPaymentTypeData();

  // Opciones para las gráficas
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 1 && context.chart.config.type === 'bar') {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${context.parsed.y || context.parsed}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Row className="mb-4">
      {/* Gráfica de Métodos de Pago por Cantidad */}
      <Col lg={6} className="mb-4">
        <Card>
          <Card.Header>
            <h6><i className="bi bi-credit-card"></i> Métodos de Pago - Cantidad</h6>
          </Card.Header>
          <Card.Body style={{ height: '300px' }}>
            <Pie data={methodData.counts} options={pieOptions} />
          </Card.Body>
        </Card>
      </Col>

      {/* Gráfica de Métodos de Pago por Monto */}
      <Col lg={6} className="mb-4">
        <Card>
          <Card.Header>
            <h6><i className="bi bi-currency-dollar"></i> Métodos de Pago - Monto</h6>
          </Card.Header>
          <Card.Body style={{ height: '300px' }}>
            <Doughnut 
              data={methodData.amounts} 
              options={{
                ...pieOptions,
                plugins: {
                  ...pieOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }} 
            />
          </Card.Body>
        </Card>
      </Col>

      {/* Gráfica de Estados */}
      <Col lg={8} className="mb-4">
        <Card>
          <Card.Header>
            <h6><i className="bi bi-bar-chart"></i> Distribución por Estado</h6>
          </Card.Header>
          <Card.Body style={{ height: '350px' }}>
            <Bar data={statusData} options={chartOptions} />
          </Card.Body>
        </Card>
      </Col>

      {/* Gráfica de Tipos de Pago */}
      <Col lg={4} className="mb-4">
        <Card>
          <Card.Header>
            <h6><i className="bi bi-pie-chart"></i> Tipos de Pago</h6>
          </Card.Header>
          <Card.Body style={{ height: '350px' }}>
            <Doughnut data={paymentTypeData} options={pieOptions} />
          </Card.Body>
        </Card>
      </Col>

      {/* Gráfica de Tendencia */}
      <Col lg={12} className="mb-4">
        <Card>
          <Card.Header>
            <h6><i className="bi bi-graph-up"></i> Tendencia de Pagos por Fecha</h6>
          </Card.Header>
          <Card.Body style={{ height: '400px' }}>
            <Line data={trendData} options={chartOptions} />
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

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

  // ✅ Estados para reportes
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    paymentMethod: ''
  });

  // ✅ Ref para impresión
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Reporte_Pagos_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
      }
    `
  });

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

  // ✅ Función para generar reporte con filtros específicos
  const generateReport = () => {
    // Aplicar filtros del reporte
    const currentFilters = { ...filters };
    if (reportFilters.startDate) currentFilters.dateFrom = reportFilters.startDate;
    if (reportFilters.endDate) currentFilters.dateTo = reportFilters.endDate;
    if (reportFilters.status) currentFilters.status = reportFilters.status;
    if (reportFilters.paymentMethod) currentFilters.paymentMethod = reportFilters.paymentMethod;
    
    setFilters(currentFilters);
    setShowReportModal(false);
    
    // Esperar a que se carguen los datos y luego imprimir
    setTimeout(() => {
      handlePrint();
    }, 1000);
  };

  // ✅ Función para exportar a CSV
  const exportToCSV = () => {
    if (!payments) return;

    const headers = ['ID', 'Cotización', 'Cliente', 'Monto', 'Método', 'Estado', 'Fecha', 'Referencia'];
    const csvData = payments.payments.map(payment => [
      payment.id,
      payment.quoteId,
      payment.Quote?.Client.name || '',
      payment.amount,
      PAYMENT_METHODS.find(m => m.value === payment.paymentMethod)?.label || payment.paymentMethod,
      PAYMENT_STATUS.find(s => s.value === payment.status)?.label || payment.status,
      formatDate(payment.paymentDate!),
      payment.transactionReference || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pagos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ ESTADO PARA MOSTRAR/OCULTAR GRÁFICAS
  const [showCharts, setShowCharts] = useState(false);

  return (
    <div>
      {/* Navegación */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <Link to="/dashboard" className="btn btn-secondary">
          <i className="bi bi-arrow-left"></i> Volver
        </Link>
        
        {/* ✅ Botones de reportes y gráficas */}
        <div className="d-flex gap-2 flex-wrap">
          <Button 
            variant={showCharts ? "outline-primary" : "primary"} 
            onClick={() => setShowCharts(!showCharts)}
            disabled={!payments || payments.payments.length === 0}
          >
            <i className={`bi ${showCharts ? 'bi-table' : 'bi-graph-up'}`}></i> 
            {showCharts ? ' Ver Tabla' : ' Ver Gráficas'}
          </Button>
          <Button variant="info" onClick={() => setShowReportModal(true)}>
            <i className="bi bi-file-earmark-pdf"></i> Generar Reporte
          </Button>
          <Button variant="success" onClick={exportToCSV} disabled={!payments || payments.payments.length === 0}>
            <i className="bi bi-file-earmark-excel"></i> Exportar CSV
          </Button>
          <Button variant="warning" onClick={handlePrint} disabled={!payments || payments.payments.length === 0}>
            <i className="bi bi-printer"></i> Imprimir Actual
          </Button>
        </div>
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

      {/* ✅ MOSTRAR GRÁFICAS O TABLA SEGÚN EL ESTADO */}
      {showCharts ? (
        /* Mostrar gráficas */
        payments && payments.payments.length > 0 ? (
          <>
            <Alert variant="info" className="mb-3">
              <i className="bi bi-info-circle"></i>
              <strong> Vista de Gráficas:</strong> Análisis visual de los pagos actuales. 
              Use los filtros para cambiar los datos mostrados en las gráficas.
            </Alert>
            <PaymentCharts payments={payments} />
          </>
        ) : (
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle"></i>
            No hay datos suficientes para mostrar las gráficas. 
            Ajuste los filtros o agregue más pagos.
          </Alert>
        )
      ) : (
        /* Mostrar tabla (código existente) */
        <>
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
        </>
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

      {/* ✅ Modal para configurar reporte */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-file-earmark-pdf"></i> Generar Reporte de Pagos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Desde</Form.Label>
                <Form.Control
                  type="date"
                  value={reportFilters.startDate}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Hasta</Form.Label>
                <Form.Control
                  type="date"
                  value={reportFilters.endDate}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={reportFilters.status}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
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
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Método de Pago</Form.Label>
                <Form.Select
                  value={reportFilters.paymentMethod}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
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
          </Row>
          <Alert variant="info">
            <i className="bi bi-info-circle"></i>
            <strong> Nota:</strong> El reporte incluirá resumen ejecutivo, análisis por estado y método, 
            y el detalle completo de todos los pagos que coincidan con los filtros seleccionados.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={generateReport}>
            <i className="bi bi-file-earmark-pdf"></i> Generar Reporte
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Componente oculto para impresión */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {payments && (
            <PrintablePaymentReport 
              payments={payments} 
              summary={summary} 
              filters={filters} 
            />
          )}
        </div>
      </div>
    </div>
  );
}