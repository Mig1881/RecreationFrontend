// src/api/apiClient.ts

const BASE_URL = 'http://localhost:8081/api';

interface RequestOptions extends RequestInit {
  data?: unknown;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

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

    //Si no hay contenido (Ej. DELETE)
    if (response.status === 204) {
      return null as T;
    }

    //Comprobamos el tipo de contenido que devuelve el backend
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json(); // Si es JSON, lo parseamos normal
    } else {
      data = await response.text(); // Si es texto plano (como en el Register), lo leemos como texto
    }

    //Control de Errores
    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
      
      // Si falló, 'data' debería ser el JSON ErrorResponse del backend
      throw {
        status: response.status,
        message: data.message || (typeof data === 'string' ? data : 'Error inesperado en el servidor'),
        error: data.error || 'Error HTTP',
        path: data.path || endpoint
      };
    }

    // Devolvemos la data validada
    return data as T;
  } catch (error: any) {
    if (error instanceof TypeError) {
      throw { status: 0, message: 'No se pudo conectar con el servidor', error: 'Network Error' };
    }
    throw error;
  }
}