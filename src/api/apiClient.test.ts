import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { apiClient } from "./apiClient";

// CONFIGURACIÓN GLOBAL DE MOCKS
globalThis.fetch = vi.fn();

describe("Capa de Red: apiClient Personalizado", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- 1. SECCIÓN DE INYECCIÓN DE CABECERAS Y PAYLOADS ---
  
  it("1. Debe inyectar el token JWT y procesar el objeto 'data' transformándolo en el body", async () => {
    // ARRANGE
    const tokenFalso = "jwt-napoleon-1808";
    localStorage.setItem("token", tokenFalso);
    
    const payloadEnvio = { name: "Batalla de Bailén", year: 1808 };
    const respuestaBackend = { id: 1, ...payloadEnvio };

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (header: string) => header.toLowerCase() === "content-type" ? "application/json" : null
      },
      json: async () => respuestaBackend,
    });

    // ACT
    const resultado = await apiClient("/events", { method: "POST", data: payloadEnvio });

    // ASSERT
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/events"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payloadEnvio),
        headers: expect.any(Headers) 
      })
    );
    expect(resultado).toEqual(respuestaBackend);
  });

  // --- 2. SECCIÓN DE POLIMORFISMO DE RESPUESTAS (JSON, TEXTO, 204) ---

  it("2. Debe retornar null si el servidor responde con un Status 204 (No Content)", async () => {
    // ARRANGE
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 204,
    });

    // ACT
    const resultado = await apiClient("/events/1", { method: "DELETE" });

    // ASSERT
    expect(resultado).toBeNull();
  });

  it("3. Debe parsear la respuesta como texto plano si el Content-Type no es JSON", async () => {
    // ARRANGE
    const textoPlano = "Usuario registrado con éxito";
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (header: string) => header.toLowerCase() === "content-type" ? "text/plain" : null
      },
      text: async () => textoPlano,
    });

    // ACT
    const resultado = await apiClient("/auth/register", { method: "POST" });

    // ASSERT
    expect(resultado).toBe(textoPlano);
  });

  // --- 3. SECCIÓN DE CONTROL DE ERRORES (HTTP ERRORS & INTERCEPTORES) ---

  it("4. Debe disparar un evento global 'auth-unauthorized' si el servidor responde con 401", async () => {
    // ARRANGE
    const spyEvent = vi.spyOn(window, "dispatchEvent");
    const errorBackend = { message: "Token expirado o inválido", error: "Unauthorized", path: "/secure-data" };

    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      headers: {
        get: (header: string) => header.toLowerCase() === "content-type" ? "application/json" : null
      },
      json: async () => errorBackend,
    });

    // ACT & ASSERT
    await expect(apiClient("/secure-data")).rejects.toEqual({
      status: 401,
      message: "Token expirado o inválido",
      error: "Unauthorized",
      path: "/secure-data"
    });

    // Verificamos que el interceptor reaccionó y notificó a la aplicación
    expect(spyEvent).toHaveBeenCalledWith(expect.any(Event));
    expect(spyEvent.mock.calls[0][0].type).toBe("auth-unauthorized");
  });

  it("5. Debe mapear y lanzar un error genérico si el JSON de error del backend no trae campos específicos", async () => {
    // ARRANGE
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: (header: string) => header.toLowerCase() === "content-type" ? "application/json" : null
      },
      json: async () => ({}), // Backend responde JSON vacío
    });

    // ACT & ASSERT
    await expect(apiClient("/broken-endpoint")).rejects.toEqual({
      status: 500,
      message: "Error inesperado en el servidor",
      error: "Error HTTP",
      path: "/broken-endpoint"
    });
  });

  // --- 4. SECCIÓN DE ERRORES DE RED (FALLO DE CONEXIÓN) ---

  it("6. Debe capturar un TypeError de Fetch y transformarlo en un mensaje de Network Error amigable", async () => {
    // ARRANGE
    // Simulamos que fetch falla a nivel de red (sin conexión a internet, servidor apagado, etc.)
    (globalThis.fetch as any).mockRejectedValue(new TypeError("Failed to fetch"));

    // ACT & ASSERT
    await expect(apiClient("/any-endpoint")).rejects.toEqual({
      status: 0,
      message: "No se pudo conectar con el servidor",
      error: "Network Error"
    });
  });
});