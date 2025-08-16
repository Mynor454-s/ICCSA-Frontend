import { useEffect, useState } from "react";
import { getServices, createService, updateService, deleteService } from "../api/services.js";
import type { Service } from "../api/services.js";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function ServicesAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Service>({
    name: "",
    description: "",
    price: 0
  });

  // Cargar servicios
  const loadServices = async () => {
    try {
      const res = await getServices();
      setServices(res);
    } catch (error) {
      console.error("Error cargando servicios", error);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Manejar cambios en formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === "price" ? (value === "" ? "" : parseFloat(value) || 0) : value 
    });
  };

  // Abrir modal para crear
  const handleAdd = () => {
    setEditingService(null);
    setFormData({ name: "", description: "", price: "" as any });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      ...service,
      price: typeof service.price === 'string' ? parseFloat(service.price) : service.price
    });
    setShowModal(true);
  };

  // Guardar cambios (crear o editar)
  const handleSave = async () => {
    try {
      if (editingService) {
        await updateService(editingService.id!, formData);
      } else {
        await createService(formData);
      }
      setShowModal(false);
      loadServices();
    } catch (error) {
      console.error("Error guardando servicio", error);
    }
  };

  // Eliminar servicio
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este servicio?")) {
      try {
        await deleteService(id);
        loadServices();
      } catch (error) {
        console.error("Error eliminando servicio", error);
      }
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
      <h2 className="mb-4">Gestión de Servicios</h2>
      <Button variant="primary" onClick={handleAdd} className="mb-3">
        <i className="bi bi-plus-circle me-2"></i>Agregar Servicio
      </Button>

      {/* Tabla de servicios */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {services.length > 0 ? (
            services.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.description}</td>
                <td>Q{Number(s.price).toFixed(2)}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(s)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(s.id!)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center">
                No hay servicios registrados
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal para agregar/editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingService ? "Editar Servicio" : "Agregar Servicio"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre del servicio"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción del servicio"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </Form.Group>
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
    </div>
  );
}