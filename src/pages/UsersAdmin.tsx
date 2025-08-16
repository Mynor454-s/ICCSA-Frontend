import { useEffect, useState } from "react";
import { Button, Table, Spinner, Alert } from "react-bootstrap";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import UserFormModal from "../components/UsersFormModal";
import { Link } from "react-router-dom";

interface User {
  id: number;
  name: string;
  email: string;
  role: number;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data.users); // ✅ CORREGIDO
    } catch (err) {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setSelectedUser(null);
    setShowModal(true);
  }

  function handleEdit(user: User) {
    setSelectedUser(user);
    setShowModal(true);
  }

  async function handleDelete(id: number) {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch {
        setError("No se pudo eliminar el usuario.");
      }
    }
  }

  return (
    <div>
            {/* Botón volver */}
            <div className="mb-3">
              <Link to="/dashboard" className="btn btn-secondary">
                <i className="bi bi-arrow-left"></i> Volver
              </Link>
            </div>
            <h2 className="mb-4">Gestión de Materiales</h2>
            <Button variant="primary" onClick={handleCreate} className="mb-3">
              <i className="bi bi-plus-circle me-2"></i>Agregar Material
            </Button>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Administrar Usuarios</h4>
        <Button onClick={handleCreate}>+ Nuevo Usuario</Button>
      </div>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <Button variant="warning" size="sm" onClick={() => handleEdit(u)}>Editar</Button>{" "}
                  <Button variant="danger" size="sm" onClick={() => handleDelete(u.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showModal && (
        <UserFormModal
          show={showModal}
          onHide={() => setShowModal(false)}
          onSave={async () => {
            setShowModal(false);
            fetchUsers();
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
}
