import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { createUser, updateUser } from "../api/users";
import { getRoles } from "../api/roles.js";
import type { Role } from "../api/roles.js";

interface User {
  id?: number;
  name: string;
  email: string;
  role: number; // ahora es número, id del rol
}

interface UserFormModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  user: User | null;
}

export default function UserFormModal({ show, onHide, onSave, user }: UserFormModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<number | "">("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const rolesData = await getRoles();
        setRoles(rolesData);
      } catch {
        setError("No se pudieron cargar los roles");
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setRole("");
      setPassword("");
    }
    setError(null);
  }, [user, show]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || role === "") {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }
    if (!user && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const data: { name: string; email: string; roleId: number; password?: string } = {
      name,
      email,
      roleId: role as number,
    };
    if (!user) data.password = password;

    try {
      setSaving(true);
      if (user && user.id) {
        await updateUser(user.id, data);
      } else {
        await createUser(data);
      }
      onSave();
    } catch {
      setError("Error guardando el usuario. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{user ? "Editar Usuario" : "Nuevo Usuario"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="userName">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              required
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="userEmail">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              disabled={saving}
            />
          </Form.Group>

          {!user && (
            <Form.Group className="mb-3" controlId="userPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={saving}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="userRole">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              value={role}
              onChange={(e) => setRole(Number(e.target.value))}
              required
              disabled={saving || roles.length === 0}
            >
              <option value="" disabled>
                Selecciona un rol
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.description}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
