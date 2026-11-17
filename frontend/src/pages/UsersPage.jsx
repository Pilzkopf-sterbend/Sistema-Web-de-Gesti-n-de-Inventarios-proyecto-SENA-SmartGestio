// Qué hace: Muestra la gestión de usuarios.
// Para qué sirve: Crear, editar y desactivar las cuentas del sistema.

import { useEffect, useState } from 'react';
import * as userService from '../services/user.service';
import { useAlert } from '../hooks/useAlert';
import { useAuth } from '../hooks/useAuth';

// Qué hace: Carga los usuarios y permite administrarlos desde un formulario.
// Para qué sirve: Mantener controladas las cuentas con acceso al inventario.
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { show } = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [editing, setEditing] = useState(null);

  // Qué hace: Solicita la lista de usuarios.
  // Para qué sirve: Actualizar la tabla después de cada cambio.
  async function loadUsers() {
    setLoading(true);
    try {
      setUsers(await userService.listUsers());
    } catch (err) {
      show({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Para qué sirve: Cargar los usuarios al abrir la página.
  useEffect(() => {
    loadUsers();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Qué hace: Carga un usuario en el formulario.
  // Para qué sirve: Editar sus datos sin crear una cuenta nueva.
  function startEdit(user) {
    setEditing(user);
    setForm({ nombre: user.nombre, email: user.email, password: '' });
  }

  // Qué hace: Crea o actualiza un usuario.
  // Para qué sirve: Guardar los cambios del formulario.
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { nombre: form.nombre, email: form.email };
        // Para qué sirve: Cambiar la contraseña solo si el usuario escribió una nueva.
        if (form.password) {
          payload.password = form.password;
        }
        await userService.updateUser(editing.id, payload);
        show({ type: 'success', text: 'Usuario actualizado' });
      } else {
        await userService.createUser(form);
        show({ type: 'success', text: 'Usuario creado' });
      }
      setForm({ nombre: '', email: '', password: '' });
      setEditing(null);
      loadUsers();
    } catch (err) {
      show({ type: 'error', text: err.message });
    }
  }

  // Qué hace: Desactiva un usuario.
  // Para qué sirve: Retirar el acceso sin eliminar su historial.
  async function handleDeactivate(user) {
    try {
      await userService.deactivateUser(user.id);
      show({ type: 'success', text: 'Usuario desactivado' });
      loadUsers();
    } catch (err) {
      show({ type: 'error', text: err.message });
    }
  }

  // Qué hace: Limpia el formulario y cancela la edición.
  // Para qué sirve: Volver al modo de creación.
  function cancelEdit() {
    setEditing(null);
    setForm({ nombre: '', email: '', password: '' });
  }

  return (
    <div>
      <h2>Gestión de usuarios</h2>
      <form onSubmit={handleSubmit} className="card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              name="nombre"
              className="form-control"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <input
              name="email"
              type="email"
              className="form-control"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-2">
            <input
              name="password"
              type="password"
              className="form-control"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required={!editing}
              minLength={6}
            />
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-primary flex-fill">
              {editing ? 'Guardar' : 'Crear'}
            </button>
            {editing && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.nombre}</td>
                <td>{user.email}</td>
                <td>
                  {user.activo ? (
                    <span className="badge text-bg-success">Activo</span>
                  ) : (
                    <span className="badge text-bg-secondary">Inactivo</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => startEdit(user)}
                  >
                    Editar
                  </button>
                  {/* Para qué sirve: Evitar que el usuario actual se desactive a sí mismo. */}
                  {user.activo && user.id !== currentUser.id && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeactivate(user)}
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}