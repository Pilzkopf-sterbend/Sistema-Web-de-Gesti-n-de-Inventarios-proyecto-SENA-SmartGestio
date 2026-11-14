// Qué hace: Centraliza las peticiones HTTP al backend.
// Para qué sirve: Evitar repetir la URL, el token y el manejo de errores.

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Qué hace: Obtiene el token guardado en el navegador.
// Para qué sirve: Enviar la sesión del usuario en cada petición protegida.
function getToken() {
  return localStorage.getItem('token');
}

// Qué hace: Construye las cabeceras de la petición.
// Para qué sirve: Enviar JSON y el token de autenticación cuando existe.
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// Qué hace: Convierte la respuesta del backend en datos o en un error.
// Para qué sirve: Que los servicios reciban siempre un resultado claro.
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || 'Ocurrió un error en el servidor');
    // Para qué sirve: Permitir que la interfaz conozca el código HTTP del error.
    error.status = res.status;
    throw error;
  }
  return data;
}

// Qué hace: Ejecuta una petición con método, URL y cuerpo.
// Para qué sirve: Reutilizar la misma lógica para GET, POST, PUT y DELETE.
function request(method, url, body) {
  const options = { method, headers: authHeaders() };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  return fetch(`${API_URL}${url}`, options).then(handleResponse);
}

// Qué hace: Expone los métodos HTTP usados por los servicios.
// Para qué sirve: Mantener una interfaz sencilla para el resto del frontend.
export const http = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url)
};