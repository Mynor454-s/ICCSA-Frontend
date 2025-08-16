import { useEffect, useState } from "react";
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from "../api/material.js";
import type { Material } from "../api/material.js";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function MaterialsAdmin() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<Material>({
    name: "",
    unit: "",
    unitCost: 0
  });

  // Cargar materiales
  const loadMaterials = async () => {
    try {
      const res = await getMaterials();
      setMaterials(res);
    } catch (error) {
      console.error("Error cargando materiales", error);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Manejar cambios en formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === "unitCost" ? (value === "" ? "" : parseFloat(value) || 0) : value 
    });
  };

  // Abrir modal para crear
  const handleAdd = () => {
    setEditingMaterial(null);
    setFormData({ name: "", unit: "", unitCost: "" as any });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      ...material,
      unitCost: typeof material.unitCost === 'string' ? parseFloat(material.unitCost) : material.unitCost
    });
    setShowModal(true);
  };

  // Guardar cambios (crear o editar)
  const handleSave = async () => {
    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id!, formData);
      } else {
        await createMaterial(formData);
      }
      setShowModal(false);
      loadMaterials();
    } catch (error) {
      console.error("Error guardando material", error);
    }
  };

  // Eliminar material
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este material?")) {
      try {
        await deleteMaterial(id);
        loadMaterials();
      } catch (error) {
        console.error("Error eliminando material", error);
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
      <h2 className="mb-4">Gestión de Materiales</h2>
      <Button variant="primary" onClick={handleAdd} className="mb-3">
        <i className="bi bi-plus-circle me-2"></i>Agregar Material
      </Button>

      {/* Tabla de materiales */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Unidad</th>
            <th>Costo Unitario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {materials.length > 0 ? (
            materials.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.unit}</td>
                <td>Q{Number(m.unitCost).toFixed(2)}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(m)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(m.id!)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center">
                No hay materiales registrados
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal para agregar/editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingMaterial ? "Editar Material" : "Agregar Material"}</Modal.Title>
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
                placeholder="Nombre del material"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Unidad</Form.Label>
              <Form.Control
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="hoja, kg, litro, etc."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Costo Unitario</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="unitCost"
                value={formData.unitCost}
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