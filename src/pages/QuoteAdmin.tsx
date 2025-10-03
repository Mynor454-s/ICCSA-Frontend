import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from 'react-to-print';
import PrintableQuote from '../components/PrintableQuote';
import PaymentFormModal from '../components/PaymentFormModal'; // ✅ AGREGAR IMPORT
import { createQuote, updateQuoteStatus, getQuoteById, getQuoteQRInfo, getAllQuotes } from "../api/quote.js";
import { getClients } from "../api/clients.js";
import { getProducts } from "../api/products.js";
import { getMaterials } from "../api/material.js";
import { getServices } from "../api/services.js";
import { 
  getPaymentsByQuote, 
  checkDeliveryEligibility
} from '../api/payments';
import type { Quote, QuoteItem, QuoteService, QuoteQRInfo, QuotesListResponse, QuotesFilters } from "../api/quote.js";
import type { Client } from "../api/clients.js";
import type { Product } from "../api/products.js";
import type { Material } from "../api/material.js";
import type { Service } from "../api/services.js";
import type { Payment, PaymentSummary, DeliveryEligibility } from '../types/payment.types';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../types/payment.types';
import { Button, Modal, Form, Table, Card, Row, Col, Alert, Badge, Image, Pagination, ProgressBar } from "react-bootstrap"; // ✅ AGREGAR ProgressBar
import { Link } from "react-router-dom";

// Update the Quote interface to match API response
export interface QuoteApiResponse {
  id?: number;
  clientId: number;
  userId: number;
  deliveryDate: string;
  status?: string;
  total?: string;
  qrCodeUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  Client?: {
    name: string;
    email: string;
  };
  User?: {
    name: string;
    email: string;
  };
  QuoteItems: Array<{
    id?: number;
    productId: number;
    quantity: number;
    unitPrice: string;
    materialsCost?: string;
    Product?: {
      name: string;
    };
    QuoteItemMaterials: Array<{
      id?: number;
      materialId: number;
      quantity: number;
      unitPrice: string;
      cost?: string;
      Material?: {
        name: string;
      };
    }>;
  }>;
  QuoteServices: Array<{
    id?: number;
    serviceId: number;
    price: string;
    Service?: {
      name: string;
    };
  }>;
}

export default function QuoteAdmin() {
  const [currentQuote, setCurrentQuote] = useState<QuoteApiResponse | null>(null);
  const [qrInfo, setQrInfo] = useState<QuoteQRInfo | null>(null);
  const [quoteId, setQuoteId] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [formData, setFormData] = useState<Quote>({
    clientId: 0,
    userId: 1, // Assuming current user ID
    deliveryDate: "",
    items: [],
    services: []
  });

  // ✅ Estados para el listado
  const [quotesList, setQuotesList] = useState<QuotesListResponse | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [filters, setFilters] = useState<QuotesFilters>({
    page: 1,
    limit: 10,
    status: '',
    clientId: undefined
  });

  // ✅ AGREGAR ESTADOS PARA PAGOS - FALTABAN ESTAS DECLARACIONES
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [deliveryEligibility, setDeliveryEligibility] = useState<DeliveryEligibility | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false); // ✅ Para cancelar pedidos
  const [loading, setLoading] = useState(false); // ✅ Para estados de carga

  // Status options
  const statusOptions = [
    { value: "CREADA", label: "Creada", variant: "secondary" },
    { value: "ACEPTADA", label: "Aceptada", variant: "primary" },
    { value: "EN_PROCESO", label: "En Proceso", variant: "warning" },
    { value: "FINALIZADA", label: "Finalizada", variant: "info" },
    { value: "PAGADA", label: "Pagada", variant: "success" },
    { value: "ENTREGADA", label: "Entregada", variant: "dark" },
    { value: "CANCELADA", label: "Cancelada", variant: "danger" }, // ✅ AGREGAR CANCELADA
  ];

  // Get status variant for badge
  const getStatusVariant = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.variant || "secondary";
  };

  // Cargar datos de referencia
  const loadReferenceData = async () => {
    try {
      const [clientsRes, productsRes, materialsRes, servicesRes] = await Promise.all([
        getClients(),
        getProducts(),
        getMaterials(),
        getServices()
      ]);
      
      console.log('Products loaded:', productsRes);
      console.log('Materials loaded:', materialsRes);
      console.log('Services loaded:', servicesRes);
      
      setClients(clientsRes);
      setProducts(productsRes);
      setMaterials(materialsRes);
      setServices(servicesRes);
    } catch (error) {
      console.error("Error cargando datos de referencia", error);
      setMessage({ type: "danger", text: "Error cargando datos de referencia" });
    }
  };

  // ✅ Función para cargar pagos corregida
  const loadQuotePayments = async (quoteId: number) => {
    try {
      const [paymentsData, eligibilityData] = await Promise.all([
        getPaymentsByQuote(quoteId),
        checkDeliveryEligibility(quoteId)
      ]);
      
      setPayments(Array.isArray(paymentsData.payments) ? paymentsData.payments : []);
      setPaymentSummary(paymentsData.summary || null);
      setDeliveryEligibility(eligibilityData || null);
    } catch (error) {
      console.error("Error cargando pagos", error);
      setPayments([]);
      setPaymentSummary(null);
      setDeliveryEligibility(null);
    }
  };

  // ✅ Función para limpiar datos de pagos
  const clearQuoteData = () => {
    setCurrentQuote(null);
    setQrInfo(null);
    setPayments([]);
    setPaymentSummary(null);
    setDeliveryEligibility(null);
  };

  // Buscar Pedidos por ID - ✅ CORREGIDA PARA CARGAR PAGOS
  const handleSearchQuote = async () => {
    if (!quoteId.trim()) {
      setMessage({ type: "warning", text: "Ingrese un ID del Pedido" });
      return;
    }

    const parsedId = parseInt(quoteId);
    if (isNaN(parsedId) || parsedId <= 0) {
      setMessage({ type: "warning", text: "El ID debe ser un número válido mayor a 0" });
      return;
    }

    try {
      setLoading(true);
      clearQuoteData();

      const [quote, qrData] = await Promise.all([
        getQuoteById(parsedId),
        getQuoteQRInfo(parsedId).catch(() => null) // QR es opcional
      ]);
      
      setCurrentQuote(quote);
      setQrInfo(qrData);

      // ✅ Cargar pagos automáticamente
      await loadQuotePayments(parsedId);
      
      setMessage({ type: "success", text: "Pedido encontrado exitosamente" });
    } catch (error) {
      console.error("Error buscando Pedidos", error);
      setMessage({ type: "danger", text: "Pedidos no encontrada" });
      clearQuoteData();
    } finally {
      setLoading(false);
    }
  };

  // Update quote status - ✅ CORREGIDA PARA ACTUALIZAR QR INFO
  const handleUpdateStatus = async () => {
    if (!currentQuote || !selectedStatus) return;

    try {
      setLoading(true);
      await updateQuoteStatus(currentQuote.id!, { status: selectedStatus });
      
      // ✅ Actualizar el estado local
      const updatedQuote = {
        ...currentQuote,
        status: selectedStatus
      };
      setCurrentQuote(updatedQuote);
      
      // ✅ RECARGAR QR INFO DESPUÉS DE ACTUALIZAR ESTADO
      try {
        const updatedQrData = await getQuoteQRInfo(currentQuote.id!);
        setQrInfo(updatedQrData);
      } catch (qrError) {
        console.warn("Error actualizando QR info:", qrError);
        // Si falla el QR, actualizar manualmente la info local
        if (qrInfo) {
          setQrInfo({
            ...qrInfo,
            estado: selectedStatus
          });
        }
      }
      
      // Recargar pagos para actualizar estado
      await loadQuotePayments(currentQuote.id!);
      
      setShowStatusModal(false);
      setMessage({ type: "success", text: "Estado actualizado exitosamente" });
    } catch (error) {
      console.error("Error actualizando estado", error);
      setMessage({ 
        type: "danger", 
        text: error instanceof Error ? error.message : "Error actualizando estado" 
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Solo una declaración de handleOpenStatusModal
  const handleOpenStatusModal = () => {
    setSelectedStatus(currentQuote?.status || "CREADA");
    setShowStatusModal(true);
  };

  // ✅ AGREGAR FUNCIÓN PARA CANCELAR PEDIDO
  const handleCancelQuote = async () => {
    if (!currentQuote?.id) return;

    try {
      setLoading(true);
      await updateQuoteStatus(currentQuote.id, { status: "CANCELADA" });

      setCurrentQuote({ ...currentQuote, status: "CANCELADA" });
      await loadQuotePayments(currentQuote.id);

      setShowCancelModal(false);
      setMessage({ type: "success", text: "Pedido cancelado exitosamente" });
    } catch (error: any) {
      console.error("Error cancelando Pedido:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Error cancelando Pedido";
      setMessage({ type: "danger", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función para cargar listado de cotizaciones
  const loadQuotesList = async (currentFilters = filters) => {
    try {
      const cleanFilters = { ...currentFilters };
      if (!cleanFilters.status) delete cleanFilters.status;
      if (!cleanFilters.clientId) delete cleanFilters.clientId;
      
      const response = await getAllQuotes(cleanFilters);
      setQuotesList(response);
    } catch (error) {
      console.error("Error cargando listado de cotizaciones", error);
      setMessage({ type: "danger", text: "Error cargando listado de cotizaciones" });
    }
  };

  // ✅ Abrir modal de listado
  const handleShowList = () => {
    setShowListModal(true);
    loadQuotesList();
  };

  // ✅ Manejar cambios de filtros
  const handleFilterChange = (field: keyof QuotesFilters, value: any) => {
    const newFilters = {
      ...filters,
      [field]: value,
      page: field !== 'page' ? 1 : value // Reset page when changing other filters
    };
    setFilters(newFilters);
    loadQuotesList(newFilters);
  };

  // ✅ Seleccionar cotización desde el listado - CORREGIDA PARA CARGAR PAGOS
  const handleSelectQuote = async (quoteId: number) => {
    try {
      setLoading(true);
      const [quote, qrData] = await Promise.all([
        getQuoteById(quoteId),
        getQuoteQRInfo(quoteId).catch(() => null)
      ]);
      
      setCurrentQuote(quote);
      setQrInfo(qrData);
      setQuoteId(quoteId.toString());
      
      // ✅ Cargar pagos automáticamente
      await loadQuotePayments(quoteId);
      
      setShowListModal(false);
      setMessage({ type: "success", text: "Cotización cargada desde el listado" });
    } catch (error) {
      console.error("Error cargando cotización", error);
      setMessage({ type: "danger", text: "Error cargando cotización" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ref para el componente de impresión
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ Función para imprimir - API actualizada
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Orden_Pedido_${currentQuote?.id}`,
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

  // ✅ FUNCIONES PARA MANEJAR PAGOS - MEJORADA
  const handleNewPayment = () => {
    if (!currentQuote?.id) {
      setMessage({ type: "warning", text: "Seleccione un pedido primero" });
      return;
    }

    if (currentQuote.status === 'CANCELADA') {
      setMessage({ type: "warning", text: "No se pueden agregar pagos a pedidos cancelados" });
      return;
    }

    if (currentQuote.status === 'ENTREGADA' || deliveryEligibility?.isAlreadyDelivered) {
      setMessage({ type: "warning", text: "No se pueden agregar pagos a pedidos ya entregados" });
      return;
    }

    if (paymentSummary?.isFullyPaid) {
      setMessage({ type: "info", text: "Este pedido ya está completamente pagado" });
      return;
    }

    setSelectedPayment(null); // Para nuevo pago
    setShowPaymentModal(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment); // Para editar pago existente
    setShowPaymentModal(true);
  };

  const handlePaymentSaved = async () => {
    if (currentQuote?.id) {
      await loadQuotePayments(currentQuote.id); // Recargar pagos
      setMessage({ type: "success", text: "Pago registrado exitosamente" });
    }
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  // ✅ FUNCIÓN PARA FORMATEAR MONEDA
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ✅ FUNCIÓN PARA FORMATEAR FECHAS
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-GT');
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('es-GT'),
        time: date.toLocaleTimeString('es-GT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    } catch {
      return { date: 'Fecha inválida', time: '' };
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000); // ✅ Aumentar tiempo
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Manejar cambios en formulario básico
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "clientId" ? parseInt(value) : value
    });
  };

  // Agregar item de producto
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        productId: 0,
        quantity: 1,
        unitPrice: 0,
        materials: []
      }]
    });
  };

  // Remover item
  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Actualizar item con precarga de precio
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      console.log('Selected product:', selectedProduct);
      
      newItems[index] = { 
        ...newItems[index], 
        [field]: parseInt(value),
        unitPrice: selectedProduct?.basePrice ? parseFloat(selectedProduct.basePrice.toString()) : 0
      };
      
      console.log('Updated item:', newItems[index]);
    } else if (field === 'unitPrice') {
      newItems[index] = { ...newItems[index], [field]: parseFloat(value) || 0 };
    } else if (field === 'quantity') {
      newItems[index] = { ...newItems[index], [field]: parseInt(value) || 1 };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setFormData({ ...formData, items: newItems });
  };

  // Agregar material a item
  const addMaterialToItem = (itemIndex: number) => {
    const newItems = [...formData.items];
    newItems[itemIndex].materials.push({
      materialId: 0,
      quantity: 1,
      unitPrice: 0
    });
    setFormData({ ...formData, items: newItems });
  };

  // Remover material de item
  const removeMaterialFromItem = (itemIndex: number, materialIndex: number) => {
    const newItems = [...formData.items];
    newItems[itemIndex].materials = newItems[itemIndex].materials.filter((_, i) => i !== materialIndex);
    setFormData({ ...formData, items: newItems });
  };

  // Actualizar material en item con precarga de precio
  const updateMaterialInItem = (itemIndex: number, materialIndex: number, field: string, value: any) => {
    const newItems = [...formData.items];
    
    if (field === 'materialId') {
      const selectedMaterial = materials.find(m => m.id === parseInt(value));
      console.log('Selected material:', selectedMaterial);
      
      newItems[itemIndex].materials[materialIndex] = {
        ...newItems[itemIndex].materials[materialIndex],
        [field]: parseInt(value),
        unitPrice: selectedMaterial?.unitCost ? parseFloat(selectedMaterial.unitCost.toString()) : 0
      };
      
      console.log('Updated material:', newItems[itemIndex].materials[materialIndex]);
    } else if (field === 'unitPrice') {
      newItems[itemIndex].materials[materialIndex] = {
        ...newItems[itemIndex].materials[materialIndex],
        [field]: parseFloat(value) || 0
      };
    } else if (field === 'quantity') {
      newItems[itemIndex].materials[materialIndex] = {
        ...newItems[itemIndex].materials[materialIndex],
        [field]: parseInt(value) || 1
      };
    } else {
      newItems[itemIndex].materials[materialIndex] = {
        ...newItems[itemIndex].materials[materialIndex],
        [field]: value
      };
    }
    
    setFormData({ ...formData, items: newItems });
  };

  // Agregar servicio
  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, {
        serviceId: 0,
        price: 0
      }]
    });
  };

  // Remover servicio
  const removeService = (index: number) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  // Actualizar servicio con precarga de precio
  const updateService = (index: number, field: string, value: any) => {
    const newServices = [...formData.services];
    
    if (field === 'serviceId') {
      const selectedService = services.find(s => s.id === parseInt(value));
      console.log('Selected service:', selectedService);
      
      newServices[index] = {
        ...newServices[index],
        [field]: parseInt(value),
        price: selectedService?.price ? parseFloat(selectedService.price.toString()) : 0
      };
      
      console.log('Updated service:', newServices[index]);
    } else if (field === 'price') {
      newServices[index] = {
        ...newServices[index],
        [field]: parseFloat(value) || 0
      };
    } else {
      newServices[index] = {
        ...newServices[index],
        [field]: value
      };
    }
    
    setFormData({ ...formData, services: newServices });
  };

  // Abrir modal para crear
  const handleAdd = () => {
    setFormData({
      clientId: 0,
      userId: 1,
      deliveryDate: "",
      items: [],
      services: []
    });
    setShowModal(true);
  };

  // Guardar cambios
  const handleSave = async () => {
    try {
      const newQuote = await createQuote(formData);
      
      setMessage({ type: "success", text: "Pedidos creada exitosamente" });
      setShowModal(false);
      
      setFormData({
        clientId: 0,
        userId: 1,
        deliveryDate: "",
        items: [],
        services: []
      });
      
    } catch (error) {
      console.error("Error guardando Pedidos", error);
      setMessage({ type: "danger", text: "Error guardando Pedidos" });
    }
  };

  // Calcular total de Pedidos - ✅ CORREGIDA PARA MANEJAR STRINGS
  const calculateTotal = (quote: QuoteApiResponse | Quote) => {
    if ('QuoteItems' in quote && 'QuoteServices' in quote) {
      const itemsTotal = quote.QuoteItems.reduce((sum, item) => {
        const itemTotal = item.quantity * parseFloat(item.unitPrice);
        const materialsTotal = item.QuoteItemMaterials.reduce((matSum, mat) => 
          matSum + (mat.quantity * parseFloat(mat.unitPrice)), 0);
        return sum + itemTotal + materialsTotal;
      }, 0);
      
      const servicesTotal = quote.QuoteServices.reduce((sum, service) => 
        sum + parseFloat(service.price), 0);
      
      return itemsTotal + servicesTotal;
    } else {
      const itemsTotal = (quote.items || []).reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const materialsTotal = (item.materials || []).reduce((matSum, mat) => 
          matSum + (mat.quantity * mat.unitPrice), 0);
        return sum + itemTotal + materialsTotal;
      }, 0);
      
      const servicesTotal = (quote.services || []).reduce((sum, service) => 
        sum + service.price, 0);
      
      return itemsTotal + servicesTotal;
    }
  };

  return (
    <div>
      {/* Botón volver */}
      <div className="mb-3">
        <Link to="/dashboard" className="btn btn-secondary">
          <i className="bi bi-arrow-left"></i> Volver
        </Link>
      </div>
      
      <h2 className="mb-4">Gestión de Pedidos</h2>

      {/* Alertas */}
      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          <div className="d-flex align-items-center">
            <i className={`bi ${
              message.type === 'success' ? 'bi-check-circle' :
              message.type === 'danger' ? 'bi-exclamation-triangle' :
              message.type === 'warning' ? 'bi-exclamation-circle' :
              'bi-info-circle'
            } me-2`}></i>
            {message.text}
          </div>
        </Alert>
      )}

      {/* Buscar Pedidos */}
      <Card className="mb-4">
        <Card.Header>
          <h5><i className="bi bi-search"></i> Buscar Pedido</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>ID del Pedido</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Ingrese el ID del Pedido"
                  value={quoteId}
                  onChange={(e) => setQuoteId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchQuote()} // ✅ Enter para buscar
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={handleSearchQuote} 
                className="me-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Buscando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search"></i> Buscar
                  </>
                )}
              </Button>
              <Button variant="info" onClick={handleShowList} className="me-2" disabled={loading}>
                <i className="bi bi-list"></i> Ver Todas
              </Button>
              <Button variant="success" onClick={handleAdd}>
                <i className="bi bi-plus-circle"></i> Nuevo Pedido
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Mostrar Pedido encontrado */}
      {currentQuote && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5>Pedido #{currentQuote.id}</h5>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Badge bg={getStatusVariant(currentQuote.status || "CREADA")} className="fs-6">
                {statusOptions.find(s => s.value === currentQuote.status)?.label || currentQuote.status}
              </Badge>

              {/* Estado de pago */}
              {paymentSummary && (
                <Badge bg={paymentSummary.isFullyPaid ? 'success' : 'warning'} className="fs-6">
                  <i className={`bi ${paymentSummary.isFullyPaid ? 'bi-check-circle' : 'bi-clock'}`}></i>
                  {paymentSummary.isFullyPaid ? 'Pagado Completo' : 'Pago Pendiente'}
                </Badge>
              )}

              {/* Elegibilidad de entrega - ✅ CORREGIDA */}
              {deliveryEligibility && (
                <Badge bg={
                  deliveryEligibility.isAlreadyDelivered ? 'dark' : 
                  deliveryEligibility.canDeliver ? 'success' : 'secondary'
                } className="fs-6">
                  <i className={`bi ${
                    deliveryEligibility.isAlreadyDelivered ? 'bi-check-circle-fill' :
                    deliveryEligibility.canDeliver ? 'bi-truck' : 'bi-x-circle'
                  }`}></i>
                  {deliveryEligibility.isAlreadyDelivered ? 'Ya Entregado' :
                   deliveryEligibility.canDeliver ? 'Listo para Entrega' : 'No disponible para entrega'}
                </Badge>
              )}

              {/* Botones de acción */}
              <div className="btn-group" role="group">
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleNewPayment}
                  disabled={
                    !paymentSummary || 
                    paymentSummary.isFullyPaid || 
                    currentQuote.status === 'CANCELADA' || 
                    currentQuote.status === 'ENTREGADA' || // ✅ También deshabilitar para entregados
                    deliveryEligibility?.isAlreadyDelivered // ✅ Nueva validación
                  }
                  title={
                    currentQuote.status === 'ENTREGADA' || deliveryEligibility?.isAlreadyDelivered
                      ? "No se pueden agregar pagos a pedidos entregados"
                      : "Registrar nuevo pago"
                  }
                >
                  <i className="bi bi-cash-coin"></i>
                </Button>

                <Button
                  variant="info"
                  size="sm"
                  onClick={handlePrint}
                  title="Imprimir orden"
                >
                  <i className="bi bi-printer"></i>
                </Button>

                <Button
                  variant="warning"
                  size="sm"
                  onClick={handleOpenStatusModal}
                  disabled={currentQuote.status === 'CANCELADA'}
                  title="Cambiar estado"
                >
                  <i className="bi bi-arrow-repeat"></i>
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  disabled={currentQuote.status === 'CANCELADA'}
                  title="Cancelar pedido"
                >
                  <i className="bi bi-x-circle"></i>
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={3}>
                <strong>Cliente:</strong> {currentQuote.Client?.name || clients.find(c => c.id === currentQuote.clientId)?.name || 'Cliente no encontrado'}
              </Col>
              <Col md={3}>
                <strong>Fecha de Entrega:</strong> {formatDate(currentQuote.deliveryDate)}
              </Col>
              <Col md={3}>
                <strong>Total:</strong> {formatCurrency(calculateTotal(currentQuote))}
              </Col>
              <Col md={3}>
                {qrInfo && qrInfo.qr_url && (
                  <div className="text-center">
                    <small className="text-muted d-block">Código QR:</small>
                    <Image 
                      src={`http://localhost:3000${qrInfo.qr_url}`} 
                      alt="Código QR" 
                      width={80} 
                      height={80}
                      className="border"
                    />
                    <div className="mt-1">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => window.open(`http://localhost:3000${qrInfo.qr_url}`, '_blank')}
                      >
                        <i className="bi bi-download"></i> Descargar
                      </Button>
                    </div>
                  </div>
                )}
              </Col>
            </Row>

            {/* ✅ INFORMACIÓN DE PAGOS */}
            {paymentSummary && (
              <div className="mt-4">
                <Card className="border-primary">
                  <Card.Header className="bg-primary text-white">
                    <h6 className="mb-0 d-flex justify-content-between align-items-center">
                      <span>
                        <i className="bi bi-cash-stack"></i> Información de Pagos
                      </span>
                      {deliveryEligibility && (
                        <Badge bg={
                          deliveryEligibility.isAlreadyDelivered ? 'dark' :
                          deliveryEligibility.canDeliver ? 'success' : 'warning'
                        }>
                          <i className={`bi ${
                            deliveryEligibility.isAlreadyDelivered ? 'bi-check-circle-fill' :
                            deliveryEligibility.canDeliver ? 'bi-check-circle' : 'bi-exclamation-triangle'
                          }`}></i>
                          {deliveryEligibility.isAlreadyDelivered ? 'Ya Entregado' :
                           deliveryEligibility.canDeliver ? 'Listo para Entrega' : 'Pago Pendiente'}
                        </Badge>
                      )}
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    {/* Resumen de pagos */}
                    <Row className="mb-3">
                      <Col md={3}>
                        <div className="text-center p-3 bg-light rounded">
                          <h5 className="text-primary mb-1">{formatCurrency(
                            typeof paymentSummary.totalQuote === 'string' 
                              ? parseFloat(paymentSummary.totalQuote)
                              : paymentSummary.totalQuote
                          )}</h5>
                          <small className="text-muted">Total Cotización</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 bg-light rounded">
                          <h5 className="text-success mb-1">{formatCurrency(
                            typeof paymentSummary.totalPaid === 'string' 
                              ? parseFloat(paymentSummary.totalPaid)
                              : paymentSummary.totalPaid
                          )}</h5>
                          <small className="text-muted">Total Pagado</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 bg-light rounded">
                          <h5 className={`mb-1 ${
                            (typeof paymentSummary.remainingAmount === 'string' 
                              ? parseFloat(paymentSummary.remainingAmount)
                              : paymentSummary.remainingAmount) > 0 ? 'text-warning' : 'text-success'
                          }`}>
                            {formatCurrency(
                              typeof paymentSummary.remainingAmount === 'string' 
                                ? parseFloat(paymentSummary.remainingAmount)
                                : paymentSummary.remainingAmount
                            )}
                          </h5>
                          <small className="text-muted">Monto Pendiente</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 bg-light rounded">
                          <h5 className="text-info mb-1">{paymentSummary.paymentCount || 0}</h5>
                          <small className="text-muted">Número de Pagos</small>
                        </div>
                      </Col>
                    </Row>

                    {/* Barra de progreso */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Progreso de Pago</small>
                        <small>{(((typeof paymentSummary.totalPaid === 'string' 
                          ? parseFloat(paymentSummary.totalPaid)
                          : paymentSummary.totalPaid) / (typeof paymentSummary.totalQuote === 'string' 
                          ? parseFloat(paymentSummary.totalQuote)
                          : paymentSummary.totalQuote)) * 100).toFixed(1)}%</small>
                      </div>
                      <ProgressBar 
                        now={((typeof paymentSummary.totalPaid === 'string' 
                          ? parseFloat(paymentSummary.totalPaid)
                          : paymentSummary.totalPaid) / (typeof paymentSummary.totalQuote === 'string' 
                          ? parseFloat(paymentSummary.totalQuote)
                          : paymentSummary.totalQuote)) * 100}
                        variant={paymentSummary.isFullyPaid ? 'success' : 'warning'}
                        style={{ height: '10px' }}
                      />
                    </div>

                    {/* Historial de pagos */}
                    {Array.isArray(payments) && payments.length > 0 && (
                      <div>
                        <h6 className="mb-3">
                          <i className="bi bi-clock-history"></i> Historial de Pagos:
                        </h6>
                        <div className="table-responsive">
                          <Table size="sm" striped hover>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Método</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Referencia</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payments.map((payment) => {
                                const dateTime = formatDateTime(payment.paymentDate);
                                return (
                                  <tr key={payment.id}>
                                    <td>#{payment.id}</td>
                                    <td>
                                      {dateTime.date}
                                      {dateTime.time && (
                                        <>
                                          <br />
                                          <small className="text-muted">{dateTime.time}</small>
                                        </>
                                      )}
                                    </td>
                                    <td>
                                      <strong>
                                        {formatCurrency(
                                          typeof payment.amount === 'string' 
                                            ? parseFloat(payment.amount) 
                                            : payment.amount
                                        )}
                                      </strong>
                                    </td>
                                    <td>
                                      <small>
                                        {PAYMENT_METHODS.find(m => m.value === payment.paymentMethod)?.label || payment.paymentMethod}
                                      </small>
                                    </td>
                                    <td>
                                      <Badge bg={payment.paymentType === 'COMPLETO' ? 'success' : 'info'} size="sm">
                                        {payment.paymentType}
                                      </Badge>
                                    </td>
                                    <td>
                                      <Badge bg={PAYMENT_STATUS.find(s => s.value === payment.status)?.variant || 'secondary'}>
                                        {PAYMENT_STATUS.find(s => s.value === payment.status)?.label || payment.status}
                                      </Badge>
                                    </td>
                                    <td>
                                      {payment.transactionReference ? (
                                        <code className="small">{payment.transactionReference}</code>
                                      ) : (
                                        <span className="text-muted small">Sin referencia</span>
                                      )}
                                    </td>
                                    <td>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleEditPayment(payment)}
                                        title="Editar pago"
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Mensajes de elegibilidad - ✅ CORREGIDOS */}
                    {deliveryEligibility && deliveryEligibility.isAlreadyDelivered && (
                      <Alert variant="success" className="mt-3">
                        <i className="bi bi-check-circle-fill"></i> 
                        <strong> Pedido Entregado: </strong>
                        {deliveryEligibility.message}
                      </Alert>
                    )}

                    {deliveryEligibility && !deliveryEligibility.canDeliver && !deliveryEligibility.isAlreadyDelivered && (
                      <Alert variant="warning" className="mt-3">
                        <i className="bi bi-exclamation-triangle"></i> 
                        <strong> Restricción de Entrega: </strong>
                        {deliveryEligibility.message}
                      </Alert>
                    )}

                    {deliveryEligibility && deliveryEligibility.canDeliver && currentQuote.status !== 'ENTREGADA' && !deliveryEligibility.isAlreadyDelivered && (
                      <Alert variant="success" className="mt-3">
                        <i className="bi bi-check-circle"></i> 
                        <strong> Listo para Entrega: </strong>
                        El pago está completo y la cotización puede ser entregada.
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Items */}
            {currentQuote.QuoteItems && currentQuote.QuoteItems.length > 0 && (
              <div className="mb-3">
                <h6>Productos:</h6>
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Materiales</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuote.QuoteItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.Product?.name || products.find(p => p.id === item.productId)?.name || 'Producto no encontrado'}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(parseFloat(item.unitPrice))}</td>
                        <td>
                          {item.QuoteItemMaterials.map((mat, matIndex) => (
                            <div key={matIndex} className="small">
                              {mat.Material?.name || materials.find(m => m.id === mat.materialId)?.name}: {mat.quantity} x {formatCurrency(parseFloat(mat.unitPrice))}
                            </div>
                          ))}
                        </td>
                        <td>{formatCurrency(item.quantity * parseFloat(item.unitPrice) + 
                          item.QuoteItemMaterials.reduce((sum, mat) => sum + (mat.quantity * parseFloat(mat.unitPrice)), 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* Servicios */}
            {currentQuote.QuoteServices && currentQuote.QuoteServices.length > 0 && (
              <div>
                <h6>Servicios:</h6>
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuote.QuoteServices.map((service, index) => (
                      <tr key={index}>
                        <td>{service.Service?.name || services.find(s => s.id === service.serviceId)?.name || 'Servicio no encontrado'}</td>
                        <td>{formatCurrency(parseFloat(service.price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* ✅ AGREGAR LA SECCIÓN QR QUE ESTABA INCOMPLETA */}
            {qrInfo && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6>Información del Pedido:</h6>
                <Row>
                  <Col md={6}>
                    <small>
                      <strong>Estado:</strong> 
                      <Badge 
                        bg={getStatusVariant(currentQuote?.status || qrInfo.estado)} 
                        className="ms-2"
                      >
                        {statusOptions.find(s => s.value === (currentQuote?.status || qrInfo.estado))?.label || (currentQuote?.status || qrInfo.estado)}
                      </Badge>
                    </small><br/>
                    <small><strong>Fecha Creación:</strong> {qrInfo.fecha_creacion}</small>
                  </Col>
                  <Col md={6}>
                    <small><strong>Total:</strong> {formatCurrency(calculateTotal(currentQuote))}</small><br/>
                    <small><strong>Fecha Entrega:</strong> {formatDate(currentQuote?.deliveryDate || qrInfo.fecha_entrega)}</small>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ✅ MODAL PARA PAGOS */}
      <PaymentFormModal
        show={showPaymentModal}
        onHide={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        quoteId={currentQuote?.id}
        totalQuote={calculateTotal(currentQuote || { items: [], services: [] })}
        paymentSummary={paymentSummary || undefined}
        onSave={handlePaymentSaved}
      />

      {/* ✅ MODAL PARA CREAR/EDITAR PEDIDO - FALTABA ESTE MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-circle"></i> Crear Nuevo Pedido
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Información básica */}
            <Card className="mb-4">
              <Card.Header>
                <h6><i className="bi bi-info-circle"></i> Información Básica</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cliente *</Form.Label>
                      <Form.Select
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione un cliente</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name} - {client.email}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Entrega *</Form.Label>
                      <Form.Control
                        type="date"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Productos */}
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6><i className="bi bi-box"></i> Productos</h6>
                <Button variant="outline-primary" size="sm" onClick={addItem}>
                  <i className="bi bi-plus"></i> Agregar Producto
                </Button>
              </Card.Header>
              <Card.Body>
                {formData.items.length === 0 ? (
                  <Alert variant="info">
                    <i className="bi bi-info-circle"></i> No hay productos agregados. 
                    Haga clic en "Agregar Producto" para comenzar.
                  </Alert>
                ) : (
                  formData.items.map((item, index) => (
                    <Card key={index} className="mb-3 border-start border-primary border-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h6 className="text-primary">Producto #{index + 1}</h6>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => removeItem(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                        
                        <Row>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Producto *</Form.Label>
                              <Form.Select
                                value={item.productId}
                                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                required
                              >
                                <option value="">Seleccione producto</option>
                                {products.map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} - Q{product.basePrice}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Cantidad *</Form.Label>
                              <Form.Control
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Precio Unitario *</Form.Label>
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2}>
                            <Form.Group className="mb-3">
                              <Form.Label>Subtotal</Form.Label>
                              <Form.Control
                                type="text"
                                value={formatCurrency(item.quantity * item.unitPrice)}
                                disabled
                                className="bg-light"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Materiales del producto */}
                        <div className="border-top pt-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted fw-bold">Materiales Adicionales:</small>
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              onClick={() => addMaterialToItem(index)}
                            >
                              <i className="bi bi-plus"></i> Agregar Material
                            </Button>
                          </div>
                          
                          {item.materials.map((material, matIndex) => (
                            <Row key={matIndex} className="mb-2 align-items-end">
                              <Col md={4}>
                                <Form.Select
                                  value={material.materialId}
                                  onChange={(e) => updateMaterialInItem(index, matIndex, 'materialId', e.target.value)}
                                  size="sm"
                                >
                                  <option value="">Seleccione material</option>
                                  {materials.map(mat => (
                                    <option key={mat.id} value={mat.id}>
                                      {mat.name} - Q{mat.unitCost}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Col>
                              <Col md={2}>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={material.quantity}
                                  onChange={(e) => updateMaterialInItem(index, matIndex, 'quantity', e.target.value)}
                                  size="sm"
                                  placeholder="Cant."
                                />
                              </Col>
                              <Col md={3}>
                                <Form.Control
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={material.unitPrice}
                                  onChange={(e) => updateMaterialInItem(index, matIndex, 'unitPrice', e.target.value)}
                                  size="sm"
                                  placeholder="Precio"
                                />
                              </Col>
                              <Col md={2}>
                                <Form.Control
                                  type="text"
                                  value={formatCurrency(material.quantity * material.unitPrice)}
                                  disabled
                                  size="sm"
                                  className="bg-light"
                                />
                              </Col>
                              <Col md={1}>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => removeMaterialFromItem(index, matIndex)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </Col>
                            </Row>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Servicios */}
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6><i className="bi bi-tools"></i> Servicios</h6>
                <Button variant="outline-success" size="sm" onClick={addService}>
                  <i className="bi bi-plus"></i> Agregar Servicio
                </Button>
              </Card.Header>
              <Card.Body>
                {formData.services.length === 0 ? (
                  <Alert variant="info">
                    <i className="bi bi-info-circle"></i> No hay servicios agregados.
                  </Alert>
                ) : (
                  formData.services.map((service, index) => (
                    <Row key={index} className="mb-3 align-items-end">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Servicio *</Form.Label>
                          <Form.Select
                            value={service.serviceId}
                            onChange={(e) => updateService(index, 'serviceId', e.target.value)}
                            required
                          >
                            <option value="">Seleccione servicio</option>
                            {services.map(serv => (
                              <option key={serv.id} value={serv.id}>
                                {serv.name} - Q{serv.price}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Precio *</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={service.price}
                            onChange={(e) => updateService(index, 'price', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Button 
                          variant="outline-danger" 
                          onClick={() => removeService(index)}
                          className="w-100"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </Col>
                    </Row>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Resumen */}
            <Card className="bg-light">
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <h6>Resumen del Pedido:</h6>
                    <ul className="mb-0">
                      <li>Cliente: {clients.find(c => c.id === formData.clientId)?.name || 'No seleccionado'}</li>
                      <li>Productos: {formData.items.length}</li>
                      <li>Servicios: {formData.services.length}</li>
                      <li>Fecha de entrega: {formData.deliveryDate || 'No seleccionada'}</li>
                    </ul>
                  </Col>
                  <Col md={4} className="text-end">
                    <h4 className="text-primary">
                      Total: {formatCurrency(calculateTotal(formData))}
                    </h4>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            <i className="bi bi-x"></i> Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleSave}
            disabled={!formData.clientId || !formData.deliveryDate || (formData.items.length === 0 && formData.services.length === 0)}
          >
            <i className="bi bi-save"></i> Crear Pedido
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ MODAL PARA LISTADO DE PEDIDOS - TAMBIÉN FALTABA */}
      <Modal show={showListModal} onHide={() => setShowListModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-list"></i> Lista de Pedidos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Filtros */}
          <Card className="mb-3">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    >
                      <option value="">Todos los estados</option>
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Cliente</Form.Label>
                    <Form.Select
                      value={filters.clientId || ''}
                      onChange={(e) => handleFilterChange('clientId', e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                      <option value="">Todos los clientes</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Por página</Form.Label>
                    <Form.Select
                      value={filters.limit}
                      onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setFilters({ page: 1, limit: 10, status: '', clientId: undefined });
                      loadQuotesList({ page: 1, limit: 10, status: '', clientId: undefined });
                    }}
                    className="w-100"
                  >
                    <i className="bi bi-arrow-clockwise"></i> Limpiar Filtros
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lista */}
          {quotesList && (
            <>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th>Fecha Entrega</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotesList.quotes.map(quote => (
                      <tr key={quote.id}>
                        <td>#{quote.id}</td>
                        <td>{quote.Client?.name || 'N/A'}</td>
                        <td>
                          <Badge bg={getStatusVariant(quote.status || 'CREADA')}>
                            {statusOptions.find(s => s.value === quote.status)?.label || quote.status}
                          </Badge>
                        </td>
                        <td>{formatCurrency(parseFloat(quote.total || '0'))}</td>
                        <td>{formatDate(quote.deliveryDate)}</td>
                        <td>{formatDate(quote.createdAt)}</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSelectQuote(quote.id!)}
                          >
                            <i className="bi bi-eye"></i> Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Paginación */}
              {quotesList.pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination>
                    <Pagination.First 
                      disabled={quotesList.pagination.currentPage === 1}
                      onClick={() => handleFilterChange('page', 1)}
                    />
                    <Pagination.Prev 
                      disabled={quotesList.pagination.currentPage === 1}
                      onClick={() => handleFilterChange('page', quotesList.pagination.currentPage - 1)}
                    />
                    
                    {[...Array(quotesList.pagination.totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === quotesList.pagination.totalPages ||
                        (page >= quotesList.pagination.currentPage - 2 && page <= quotesList.pagination.currentPage + 2)
                      ) {
                        return (
                          <Pagination.Item
                            key={page}
                            active={page === quotesList.pagination.currentPage}
                            onClick={() => handleFilterChange('page', page)}
                          >
                            {page}
                          </Pagination.Item>
                        );
                      } else if (
                        page === quotesList.pagination.currentPage - 3 ||
                        page === quotesList.pagination.currentPage + 3
                      ) {
                        return <Pagination.Ellipsis key={page} disabled />;
                      }
                      return null;
                    })}
                    
                    <Pagination.Next 
                      disabled={quotesList.pagination.currentPage === quotesList.pagination.totalPages}
                      onClick={() => handleFilterChange('page', quotesList.pagination.currentPage + 1)}
                    />
                    <Pagination.Last 
                      disabled={quotesList.pagination.currentPage === quotesList.pagination.totalPages}
                      onClick={() => handleFilterChange('page', quotesList.pagination.totalPages)}
                    />
                  </Pagination>
                </div>
              )}

              {/* Info de paginación */}
              <div className="text-center text-muted small mt-2">
                Mostrando {((quotesList.pagination.currentPage - 1) * quotesList.pagination.quotesPerPage) + 1} a {' '}
                {Math.min(quotesList.pagination.currentPage * quotesList.pagination.quotesPerPage, quotesList.pagination.totalQuotes)} de {' '}
                {quotesList.pagination.totalQuotes} pedidos
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* ✅ MODAL PARA CANCELAR PEDIDO */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle"></i> Confirmar Cancelación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle"></i>
            <strong> ¿Está seguro que desea cancelar este pedido?</strong>
          </Alert>
          <p>
            El pedido #{currentQuote?.id} será marcado como <strong>CANCELADA</strong> y podrá seguir viéndolo en la lista, 
            pero no se podrán realizar más cambios ni pagos.
          </p>
          <div className="bg-light p-3 rounded">
            <strong>Cliente:</strong> {currentQuote?.Client?.name}<br />
            <strong>Total:</strong> {formatCurrency(calculateTotal(currentQuote || { items: [], services: [] }))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            <i className="bi bi-x"></i> No, Cerrar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCancelQuote}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cancelando...
              </>
            ) : (
              <>
                <i className="bi bi-check"></i> Sí, Cancelar Pedido
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para cambiar estado */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-arrow-repeat"></i> Cambiar Estado de Pedidos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nuevo Estado</Form.Label>
            <Form.Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {selectedStatus && (
            <div className="mt-3 p-3 bg-light rounded">
              <small className="text-muted">
                <strong>Estado actual:</strong> {statusOptions.find(s => s.value === currentQuote?.status)?.label}
                <br />
                <strong>Nuevo estado:</strong> {statusOptions.find(s => s.value === selectedStatus)?.label}
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateStatus}
            disabled={!selectedStatus || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Actualizando...
              </>
            ) : (
              'Actualizar Estado'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Componente oculto para impresión */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {currentQuote && (
            <PrintableQuote
              quote={currentQuote}
              clients={clients}
              products={products}
              materials={materials}
              services={services}
              qrInfo={qrInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
}