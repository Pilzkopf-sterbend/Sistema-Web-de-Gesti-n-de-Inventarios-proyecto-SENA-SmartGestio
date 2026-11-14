// Qué hace: Muestra el formulario para registrar un movimiento.
// Para qué sirve: Permitir entradas y salidas que actualizan el stock.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as movementService from '../services/movement.service';
import * as productService from '../services/product.service';
import { useAlert } from '../hooks/useAlert';

// Qué hace: Captura el producto, el tipo y la cantidad del movimiento.
// Para qué sirve: Registrar la operación y volver al historial.
export default function MovementFormPage() {
  const navigate = useNavigate();
  const { show } = useAlert();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [form, setForm] = useState({
    tipo: 'entrada',
    cantidad: '',
    observacion: ''
  });

  // Para qué sirve: Cargar los productos disponibles en el selector.
  useEffect(() => {
    productService.listProducts().then(setProducts).catch(() => {});
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Qué hace: Envía el movimiento al backend.
  // Para qué sirve: Actualizar el stock y mostrar el resultado al usuario.
  async function handleSubmit(e) {
    e.preventDefault();
    // Para qué sirve: Convertir la cantidad a número antes de enviarla.
    const payload = {
      producto: selectedProduct,
      tipo: form.tipo,
      cantidad: Number(form.cantidad),
      observacion: form.observacion
    };
    try {
      const result = await movementService.createMovement(payload);
      show({ type: 'success', text: result.message });
      navigate('/movements');
    } catch (err) {
      show({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="card p-4" style={{ maxWidth: '560px' }}>
      <h2 className="h4 mb-3">Registrar movimiento</h2>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Producto</label>
            <select
              className="form-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
            >
              <option value="">Seleccione un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — Stock: {p.cantidadDisponible} {p.unidadMedida}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Tipo de operación</label>
            <select
              name="tipo"
              className="form-select"
              value={form.tipo}
              onChange={handleChange}
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Cantidad</label>
            <input
              name="cantidad"
              type="number"
              min="1"
              step="1"
              className="form-control"
              value={form.cantidad}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label">Observación (opcional)</label>
            <input
              name="observacion"
              className="form-control"
              value={form.observacion}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-primary">Registrar</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/movements')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}