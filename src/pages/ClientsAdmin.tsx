// src/pages/Clients.tsx
import { useEffect, useState } from "react";
import { getClients, createClient, updateClient, deleteClient } from "../api/clients";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";

interface Client {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Client>({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // Cargar clientes
  const loadClients = async () => {
    try {
      const res = await getClients();
      setClients(res);
    } catch (error) {
      console.error("Error cargando clientes", error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Manejar cambios en formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Abrir modal para crear
  const handleAdd = () => {
    setEditingClient(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setShowModal(true);
  };

  // Guardar cambios (crear o editar)
  const handleSave = async () => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id!, formData);
      } else {
        await createClient(formData);
      }
      setShowModal(false);
      loadClients();
    } catch (error) {
      console.error("Error guardando cliente", error);
    }
  };

  // Eliminar cliente
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await deleteClient(id);
        loadClients();
      } catch (error) {
        console.error("Error eliminando cliente", error);
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
      <h2 className="mb-4">Gestión de Clientes</h2>
      <Button variant="primary" onClick={handleAdd} className="mb-3">
        <i className="bi bi-plus-circle me-2"></i>Agregar Cliente
      </Button>

      {/* Tabla de clientes */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.length > 0 ? (
            clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.address}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(c)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(c.id!)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">
                No hay clientes registrados
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal para agregar/editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingClient ? "Editar Cliente" : "Agregar Cliente"}</Modal.Title>
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
                placeholder="Nombre completo"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Número de teléfono"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Dirección"
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
