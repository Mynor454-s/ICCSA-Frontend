import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/products.js";
import type { Product } from "../api/products.js";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import PrintableList from "../components/PrintableList";
import { usePrintableList } from "../hooks/usePrintableList";

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    basePrice: 0
  });

  // Cargar productos
  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res);
    } catch (error) {
      console.error("Error cargando productos", error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Manejar cambios en formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === "basePrice" ? (value === "" ? "" : parseFloat(value) || 0) : value 
    });
  };

  // Abrir modal para crear
  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", basePrice: "" as any });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      basePrice: typeof product.basePrice === 'string' ? parseFloat(product.basePrice) : product.basePrice
    });
    setShowModal(true);
  };

  // Guardar cambios (crear o editar)
  const handleSave = async () => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id!, formData);
      } else {
        await createProduct(formData);
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error("Error guardando producto", error);
    }
  };

  // Eliminar producto
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error("Error eliminando producto", error);
      }
    }
  };

  // ✅ Hook para impresión
  const { printRef, handlePrint } = usePrintableList("Listado_Productos");

  // ✅ Configuración de columnas para productos
  const printColumns = [
    { key: 'name', label: 'Nombre del Producto', align: 'left' as const },
    { key: 'description', label: 'Descripción', align: 'left' as const },
    { 
      key: 'basePrice', 
      label: 'Precio Base', 
      align: 'right' as const,
      format: (value: number | string) => `Q${Number(value).toFixed(2)}`
    }
  ];

  return (
    <div>
      {/* Botón volver */}
      <div className="mb-3">
        <Link to="/dashboard" className="btn btn-secondary">
          <i className="bi bi-arrow-left"></i> Volver
        </Link>
      </div>
      <h2 className="mb-4">Gestión de Productos</h2>
      <Button variant="primary" onClick={handleAdd} className="mb-3">
        <i className="bi bi-plus-circle me-2"></i>Agregar Producto
      </Button>

      {/* ✅ Botón de impresión */}
      <Button 
        variant="info" 
        onClick={handlePrint}
        disabled={products.length === 0}
        className="mb-3"
      >
        <i className="bi bi-printer me-2"></i>Imprimir Listado
      </Button>

      {/* Tabla de productos */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio Base</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.description}</td>
                <td>Q{Number(p.basePrice).toFixed(2)}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(p)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(p.id!)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center">
                No hay productos registrados
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal para agregar/editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Editar Producto" : "Agregar Producto"}</Modal.Title>
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
                placeholder="Nombre del producto"
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
                placeholder="Descripción del producto"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Precio Base</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="basePrice"
                value={formData.basePrice}
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

      {/* ✅ Componente de impresión */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableList
            title="Listado de Productos"
            data={products}
            columns={printColumns}
            showCounter={true}
          />
        </div>
      </div>
    </div>
  );
}