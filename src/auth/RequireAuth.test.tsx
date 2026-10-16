import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RequireAuth from "./RequireAuth";
import { useAuth } from "../context/AuthContext";

// 1. CONFIGURACIÓN DE MOCKS GLOBALES
// Mockeamos el hook de autenticación para inyectar o remover el token a conveniencia
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mockeamos react-router-dom transformando <Navigate /> en un nodo rastreable
vi.mock("react-router-dom", () => ({
  Navigate: vi.fn(({ to }: { to: string }) => (
    <div data-testid="navigate-mock" data-to={to} />
  )),
}));

describe("Guardián de Autenticación: RequireAuth", () => {
  const contenidoProtegidoTexto = "Mando Central - Zona de Operaciones Protegida";
  const childrenDummy = <div data-testid="protected-content">{contenidoProtegidoTexto}</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- CASO 1: EXPULSIÓN POR FALTA DE SESIÓN (SAD PATH) ---

  it("1. Debe redirigir a '/login' si no existe un token activo en el estado de autenticación", () => {
    // ARRANGE
    // Simulamos un estado limpio de sesión (usuario no autenticado)
    (useAuth as any).mockReturnValue({
      state: { token: null },
    });

    // ACT
    render(<RequireAuth>{childrenDummy}</RequireAuth>);

    // ASSERT
    const redirectComponent = screen.getByTestId("navigate-mock");
    expect(redirectComponent).toBeInTheDocument();
    expect(redirectComponent).toHaveAttribute("data-to", "/login");
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  // --- CASO 2: ACCESO PERMITIDO (HAPPY PATH) ---

  it("2. Debe permitir el acceso y renderizar los componentes hijos si existe un token válido", () => {
    // ARRANGE
    // Simulamos un estado con un token JWT presente
    (useAuth as any).mockReturnValue({
      state: { token: "jwt-valido-mando-central-1808" },
    });

    // ACT
    render(<RequireAuth>{childrenDummy}</RequireAuth>);

    // ASSERT
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.getByText(contenidoProtegidoTexto)).toBeInTheDocument();
    expect(screen.queryByTestId("navigate-mock")).not.toBeInTheDocument();
  });
});