// Qué hace: Comparte los mensajes de alerta en toda la aplicación.
// Para qué sirve: Mostrar avisos de éxito o error desde cualquier página.

import { createContext, useContext, useState } from 'react';

const AlertContext = createContext(null);

// Qué hace: Guarda el mensaje actual y expone las acciones para mostrarlo.
// Para qué sirve: Centralizar las notificaciones visuales del sistema.
export function AlertProvider({ children }) {
  const [message, setMessage] = useState(null);

  // Qué hace: Muestra un mensaje de alerta.
  // Para qué sirve: Informar al usuario sobre el resultado de una acción.
  function show(message) {
    setMessage(message);
  }

  // Qué hace: Oculta el mensaje actual.
  // Para qué sirve: Cerrar la alerta cuando el usuario ya la leyó.
  function clear() {
    setMessage(null);
  }

  return (
    <AlertContext.Provider value={{ message, show, clear }}>
      {children}
    </AlertContext.Provider>
  );
}

// Qué hace: Permite consumir el contexto de alertas.
// Para qué sirve: Mostrar mensajes desde las páginas y componentes.
export function useAlert() {
  return useContext(AlertContext);
}