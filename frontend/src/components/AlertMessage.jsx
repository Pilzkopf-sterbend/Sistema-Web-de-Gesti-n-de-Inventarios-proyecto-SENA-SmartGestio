// Qué hace: Muestra el mensaje de alerta activo.
// Para qué sirve: Informar al usuario sobre el resultado de sus acciones.

import { useAlert } from '../hooks/useAlert';

// Qué hace: Renderiza una alerta de Bootstrap con opción de cerrar.
// Para qué sirve: Mostrar mensajes de éxito o error de forma visible.
export default function AlertMessage() {
  const { message, clear } = useAlert();
  if (!message) {
    return null;
  }
  // Para qué sirve: Usar color verde para éxito y rojo para errores.
  const variant = message.type === 'success' ? 'success' : 'danger';
  return (
    <div className={`alert alert-${variant} alert-dismissible`} role="alert">
      {message.text}
      <button
        type="button"
        className="btn-close"
        onClick={clear}
        aria-label="Cerrar"
      />
    </div>
  );
}