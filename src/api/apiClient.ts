// src/api/apiClient.ts

const BASE_URL = 'http://localhost:8081/api';

interface RequestOptions extends RequestInit {
  data?: unknown;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  // Inyección del token de seguridad si existe
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Configuración automática para JSON
  if (options.data) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.data);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // 204 No Content (ej. Delete de una Asociación o Inscripción)
    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json();

    // Control centralizado de errores basado en el ErrorResponse del backend
    if (!response.ok) {
      if (response.status === 401) {
        // Disparamos un evento para que el AuthContext cierre la sesión
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
      
      throw {
        status: response.status,
        message: data.message || 'Error inesperado en el servidor',
        error: data.error || 'Error HTTP',
        path: data.path || endpoint
      };
    }

    return data as T;
  } catch (error: any) {
    // Si el servidor está caído o hay un problema de red puro
    if (error instanceof TypeError) {
      throw { status: 0, message: 'No se pudo conectar con el servidor', error: 'Network Error' };
    }
    throw error;
  }
}