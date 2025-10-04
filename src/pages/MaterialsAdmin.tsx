import { useEffect, useState } from "react";
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from "../api/material.js";
import type { Material } from "../api/material.js";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import PrintableList from "../components/PrintableList";
import { usePrintableList } from "../hooks/usePrintableList";

export default function MaterialsAdmin() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<Material>({
    name: "",
    unit: "",
    unitCost: 0
  });

  // ✅ Hook personalizado para impresión
  const { printRef, handlePrint } = usePrintableList("Listado_Materiales");

  // ✅ Configuración de columnas para la tabla imprimible
  const printColumns = [
    { key: 'name', label: 'Nombre del Material', align: 'left' as const },
    { key: 'unit', label: 'Unidad de Medida', align: 'center' as const },
    { 
      key: 'unitCost', 
      label: 'Costo Unitario', 
      align: 'right' as const,
      format: (value: number | string) => `Q${Number(value).toFixed(2)}`
    }
  ];

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
      
      {/* ✅ Botones de acción */}
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <Button variant="primary" onClick={handleAdd}>
          <i className="bi bi-plus-circle me-2"></i>Agregar Material
        </Button>
        
        <Button 
          variant="info" 
          onClick={handlePrint}
          disabled={materials.length === 0}
          title={materials.length === 0 ? "No hay materiales para imprimir" : "Imprimir listado de materiales"}
        >
          <i className="bi bi-printer me-2"></i>Imprimir Listado
        </Button>
      </div>

      {/* ✅ Información resumen - Solo cantidad de materiales */}
      {materials.length > 0 && (
        <div className="mb-3 p-3 bg-light rounded">
          <div className="row">
            <div className="col-12 text-center">
              <small className="text-muted">
                <i className="bi bi-box-seam"></i> 
                <strong> Total de materiales registrados:</strong> {materials.length}
              </small>
            </div>
          </div>
        </div>
      )}

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
                    <i className="bi bi-pencil"></i> Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(m.id!)}
                  >
                    <i className="bi bi-trash"></i> Eliminar
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center">
                <div className="py-4">
                  <i className="bi bi-box-seam text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2 mb-0">No hay materiales registrados</p>
                  <small className="text-muted">Haga clic en "Agregar Material" para comenzar</small>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal para agregar/editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi ${editingMaterial ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
            {editingMaterial ? "Editar Material" : "Agregar Material"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-tag"></i> Nombre *
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre del material"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-rulers"></i> Unidad de Medida *
              </Form.Label>
              <Form.Control
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="Ej: kg, litros, hojas, metros"
                required
              />
              <Form.Text className="text-muted">
                Especifique la unidad de medida (kg, litros, hojas, metros, etc.)
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-currency-dollar"></i> Costo Unitario *
              </Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="unitCost"
                value={formData.unitCost}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
              <Form.Text className="text-muted">
                Costo por unidad en Quetzales (Q)
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            <i className="bi bi-x"></i> Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={!formData.name || !formData.unit || !formData.unitCost}
          >
            <i className={`bi ${editingMaterial ? 'bi-check' : 'bi-save'}`}></i>
            {editingMaterial ? ' Actualizar' : ' Guardar'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Componente oculto para impresión */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableList
            title="Listado de Materiales"
            data={materials}
            columns={printColumns}
            showCounter={true}
          />
        </div>
      </div>
    </div>
  );
}