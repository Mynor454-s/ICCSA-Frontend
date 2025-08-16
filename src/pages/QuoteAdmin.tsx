import { useEffect, useState } from "react";
import { createQuote, updateQuoteStatus, getQuoteById, getQuoteQRInfo, getAllQuotes } from "../api/quote.js";
import { getClients } from "../api/clients.js";
import { getProducts } from "../api/products.js";
import { getMaterials } from "../api/material.js";
import { getServices } from "../api/services.js";
import type { Quote, QuoteItem, QuoteService, QuoteQRInfo, QuotesListResponse, QuotesFilters } from "../api/quote.js";
import type { Client } from "../api/clients.js";
import type { Product } from "../api/products.js";
import type { Material } from "../api/material.js";
import type { Service } from "../api/services.js";
import { Button, Modal, Form, Table, Card, Row, Col, Alert, Badge, Image, Pagination } from "react-bootstrap";
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

  // ✅ Nuevo estado para el listado
  const [quotesList, setQuotesList] = useState<QuotesListResponse | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [filters, setFilters] = useState<QuotesFilters>({
    page: 1,
    limit: 10,
    status: '',
    clientId: undefined
  });

  // Status options
  const statusOptions = [
    { value: "CREADA", label: "Creada", variant: "secondary" },
    { value: "ACEPTADA", label: "Aceptada", variant: "primary" },
    { value: "EN_PROCESO", label: "En Proceso", variant: "warning" },
    { value: "FINALIZADA", label: "Finalizada", variant: "info" },
    { value: "PAGADA", label: "Pagada", variant: "success" },
    { value: "ENTREGADA", label: "Entregada", variant: "dark" },
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

  // Buscar Pedidos por ID
  const handleSearchQuote = async () => {
    if (!quoteId.trim()) {
      setMessage({ type: "warning", text: "Ingrese un ID del Pedido" });
      return;
    }

    try {
      const [quote, qrData] = await Promise.all([
        getQuoteById(parseInt(quoteId)),
        getQuoteQRInfo(parseInt(quoteId))
      ]);
      
      setCurrentQuote(quote);
      setQrInfo(qrData);
      setMessage({ type: "success", text: "Pedidos encontrada" });
    } catch (error) {
      console.error("Error buscando Pedidos", error);
      setMessage({ type: "danger", text: "Pedidos no encontrada" });
      setCurrentQuote(null);
      setQrInfo(null);
    }
  };

  // Update quote status
  const handleUpdateStatus = async () => {
    if (!currentQuote || !selectedStatus) return;

    try {
      await updateQuoteStatus(currentQuote.id!, { status: selectedStatus });
      
      setCurrentQuote({
        ...currentQuote,
        status: selectedStatus
      });
      
      setShowStatusModal(false);
      setMessage({ type: "success", text: "Estado actualizado exitosamente" });
    } catch (error) {
      console.error("Error actualizando estado", error);
      setMessage({ type: "danger", text: "Error actualizando estado" });
    }
  };

  // ✅ Solo una declaración de handleOpenStatusModal
  const handleOpenStatusModal = () => {
    setSelectedStatus(currentQuote?.status || "CREADA");
    setShowStatusModal(true);
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

  // ✅ Seleccionar cotización desde el listado
  const handleSelectQuote = async (quoteId: number) => {
    try {
      const [quote, qrData] = await Promise.all([
        getQuoteById(quoteId),
        getQuoteQRInfo(quoteId)
      ]);
      
      setCurrentQuote(quote);
      setQrInfo(qrData);
      setQuoteId(quoteId.toString());
      setShowListModal(false);
      setMessage({ type: "success", text: "Cotización cargada desde el listado" });
    } catch (error) {
      console.error("Error cargando cotización", error);
      setMessage({ type: "danger", text: "Error cargando cotización" });
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
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
        unitPrice: selectedMaterial?.unitCost ? parseFloat(selectedMaterial.unitCost.toString()) : 0  // ✅ Cambiar unitPrice por unitCost
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
      
      // ✅ NO actualizar currentQuote ni quoteId - solo mostrar mensaje y cerrar modal
      setMessage({ type: "success", text: "Pedidos creada exitosamente" });
      setShowModal(false);
      
      // ✅ Limpiar el formulario para la próxima Pedidos
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

  // Calcular total de Pedidos
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
          {message.text}
        </Alert>
      )}

      {/* Buscar Pedidos */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Buscar Pedido</h5>
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
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Button variant="primary" onClick={handleSearchQuote} className="me-2">
                <i className="bi bi-search"></i> Buscar
              </Button>
              <Button variant="info" onClick={handleShowList} className="me-2">
                <i className="bi bi-list"></i> Ver Todas
              </Button>
              <Button variant="success" onClick={handleAdd}>
                <i className="bi bi-plus-circle"></i> Nueva Pedidos
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Mostrar Pedidos encontrada */}
      {currentQuote && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5>Pedidos #{currentQuote.id}</h5>
            <div className="d-flex align-items-center gap-2">
              <Badge bg={getStatusVariant(currentQuote.status || "CREADA")}>
                {statusOptions.find(s => s.value === currentQuote.status)?.label || currentQuote.status}
              </Badge>
              <Button
                variant="warning"
                size="sm"
                onClick={handleOpenStatusModal}
              >
                <i className="bi bi-arrow-repeat"></i> Cambiar Estado
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={3}>
                <strong>Cliente:</strong> {currentQuote.Client?.name || clients.find(c => c.id === currentQuote.clientId)?.name || 'Cliente no encontrado'}
              </Col>
              <Col md={3}>
                <strong>Fecha de Entrega:</strong> {new Date(currentQuote.deliveryDate).toLocaleDateString()}
              </Col>
              <Col md={3}>
                <strong>Total:</strong> Q{calculateTotal(currentQuote).toFixed(2)}
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
                        <td>Q{parseFloat(item.unitPrice).toFixed(2)}</td>
                        <td>
                          {item.QuoteItemMaterials.map((mat, matIndex) => (
                            <div key={matIndex} className="small">
                              {mat.Material?.name || materials.find(m => m.id === mat.materialId)?.name}: {mat.quantity} x Q{parseFloat(mat.unitPrice).toFixed(2)}
                            </div>
                          ))}
                        </td>
                        <td>Q{(item.quantity * parseFloat(item.unitPrice) + 
                          item.QuoteItemMaterials.reduce((sum, mat) => sum + (mat.quantity * parseFloat(mat.unitPrice)), 0)).toFixed(2)}</td>
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
                        <td>Q{parseFloat(service.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {qrInfo && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6>Información del Pedido:</h6>
                <Row>
                  <Col md={6}>
                    <small><strong>Estado:</strong> {qrInfo.estado}</small><br/>
                    <small><strong>Fecha Creación:</strong> {qrInfo.fecha_creacion}</small>
                  </Col>
                  <Col md={6}>
                    <small><strong>Total:</strong> {qrInfo.total}</small><br/>
                    <small><strong>Fecha Entrega:</strong> {qrInfo.fecha_entrega}</small>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal para cambiar estado */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Estado de Pedidos</Modal.Title>
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Actualizar Estado
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para agregar nueva Pedidos */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Nueva Pedidos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                  >
                    <option value={0}>Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Entrega</Form.Label>
                  <Form.Control
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Items */}
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Productos</h5>
                <Button variant="outline-primary" size="sm" onClick={addItem}>
                  <i className="bi bi-plus"></i> Agregar Producto
                </Button>
              </Card.Header>
              <Card.Body>
                {formData.items.map((item, index) => (
                  <div key={index} className="border p-3 mb-3 rounded">
                    <Row>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Producto</Form.Label>
                          <Form.Select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          >
                            <option value={0}>Seleccionar producto</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Cantidad</Form.Label>
                          <Form.Control
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Precio Unitario</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={item.unitPrice || 0}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            placeholder="Precio se autocarga"
                          />
                          <small className="text-muted">Precio Catalogo</small>
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Label>&nbsp;</Form.Label>
                        <div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    {/* Materiales del producto */}
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">Materiales:</small>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => addMaterialToItem(index)}
                        >
                          <i className="bi bi-plus"></i> Agregar Material
                        </Button>
                      </div>
                      {item.materials.map((material, matIndex) => (
                        <Row key={matIndex} className="mb-2">
                          <Col md={4}>
                            <Form.Select
                              size="sm"
                              value={material.materialId}
                              onChange={(e) => updateMaterialInItem(index, matIndex, 'materialId', e.target.value)}
                            >
                              <option value={0}>Seleccionar material</option>
                              {materials.map(mat => (
                                <option key={mat.id} value={mat.id}>
                                  {mat.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Cantidad"
                              value={material.quantity}
                              onChange={(e) => updateMaterialInItem(index, matIndex, 'quantity', e.target.value)}
                            />
                          </Col>
                          <Col md={3}>
                            <Form.Control
                              size="sm"
                              type="number"
                              step="0.01"
                              placeholder="Precio"
                              value={material.unitPrice || 0}
                              onChange={(e) => updateMaterialInItem(index, matIndex, 'unitPrice', e.target.value)}
                            />
                            <small className="text-muted">Precio Catalogo</small>
                          </Col>
                          <Col md={2}>
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
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Servicios */}
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Servicios</h5>
                <Button variant="outline-primary" size="sm" onClick={addService}>
                  <i className="bi bi-plus"></i> Agregar Servicio
                </Button>
              </Card.Header>
              <Card.Body>
                {formData.services.map((service, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={6}>
                      <Form.Select
                        value={service.serviceId}
                        onChange={(e) => updateService(index, 'serviceId', e.target.value)}
                      >
                        <option value={0}>Seleccionar servicio</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="Precio"
                        value={service.price || 0}
                        onChange={(e) => updateService(index, 'price', e.target.value)}
                      />
                      <small className="text-muted">Precio Catalogo</small>
                    </Col>
                    <Col md={2}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeService(index)}
                      >
                        Eliminar
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Modal para listar todas las cotizaciones */}
      <Modal show={showListModal} onHide={() => setShowListModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Todas las Cotizaciones</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Filtros */}
          <Card className="mb-3">
            <Card.Header>
              <h6>Filtros</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
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
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Por página</Form.Label>
                    <Form.Select
                      value={filters.limit || 10}
                      onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabla de cotizaciones */}
          {quotesList && (
            <>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Fecha Entrega</th>
                    <th>Creada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {quotesList.quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td>#{quote.id}</td>
                      <td>
                        <div>
                          <strong>{quote.Client.name}</strong>
                          <br/>
                          <small className="text-muted">{quote.Client.email}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getStatusVariant(quote.status)}>
                          {statusOptions.find(s => s.value === quote.status)?.label || quote.status}
                        </Badge>
                      </td>
                      <td>Q{parseFloat(quote.total).toFixed(2)}</td>
                      <td>{new Date(quote.deliveryDate).toLocaleDateString()}</td>
                      <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleSelectQuote(quote.id)}
                        >
                          <i className="bi bi-eye"></i> Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Paginación */}
              {quotesList.pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    Mostrando {quotesList.quotes.length} de {quotesList.pagination.totalQuotes} cotizaciones
                  </div>
                  <Pagination>
                    <Pagination.First
                      disabled={quotesList.pagination.currentPage === 1}
                      onClick={() => handleFilterChange('page', 1)}
                    />
                    <Pagination.Prev
                      disabled={quotesList.pagination.currentPage === 1}
                      onClick={() => handleFilterChange('page', quotesList.pagination.currentPage - 1)}
                    />
                    
                    {Array.from({ length: quotesList.pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const current = quotesList.pagination.currentPage;
                        return page === 1 || page === quotesList.pagination.totalPages || 
                               (page >= current - 2 && page <= current + 2);
                      })
                      .map((page, index, array) => {
                        // ✅ Completar la lógica del if
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return [
                            <Pagination.Ellipsis key={`ellipsis-${page}`} />,
                            <Pagination.Item
                              key={page}
                              active={page === quotesList.pagination.currentPage}
                              onClick={() => handleFilterChange('page', page)}
                            >
                              {page}
                            </Pagination.Item>
                          ];
                        }
                        return (
                          <Pagination.Item
                            key={page}
                            active={page === quotesList.pagination.currentPage}
                            onClick={() => handleFilterChange('page', page)}
                          >
                            {page}
                          </Pagination.Item>
                        );
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
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowListModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}