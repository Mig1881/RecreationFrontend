import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RequireRole from "./RequireRole";
import { useAuth } from "../context/AuthContext";

// 1. CONFIGURACIÓN DE MOCKS GLOBALES
// ... el resto de tu código sigue igual ...

// 1. CONFIGURACIÓN DE MOCKS GLOBALES
// Mockeamos el contexto de autenticación para controlar el estado del usuario en cada test
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mockeamos react-router-dom transformando <Navigate /> en un elemento plano rastreable
vi.mock("react-router-dom", () => ({
  Navigate: vi.fn(({ to }: { to: string }) => (
    <div data-testid="navigate-mock" data-to={to} />
  )),
}));

describe("Guardián de Accesos: RequireRole", () => {
  const contenidoProtegidoTexto = "Mando Central - Despliegue Crítico";
  const childrenDummy = <div data-testid="protected-content">{contenidoProtegidoTexto}</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- CASO 1: ESTADO LIMBO (VERIFICACIÓN) ---
  
  it("1. Debe mostrar la pantalla de carga si el usuario está autenticado pero sus datos aún no se han resuelto", () => {
    // ARRANGE
    (useAuth as any).mockReturnValue({
      state: { isAuthenticated: true, user: null },
    });

    // ACT
    render(
      <RequireRole allowedRoles={["ROLE_ADMIN"]}>
        {childrenDummy}
      </RequireRole>
    );

    // ASSERT
    expect(screen.getByText("Verificando credenciales...")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("navigate-mock")).not.toBeInTheDocument();
  });

  // --- CASO 2: NO AUTENTICADO ---

  it("2. Debe redirigir a '/login' si el usuario no está autenticado en la plataforma", () => {
    // ARRANGE
    (useAuth as any).mockReturnValue({
      state: { isAuthenticated: false, user: null },
    });

    // ACT
    render(
      <RequireRole allowedRoles={["ROLE_ADMIN"]}>
        {childrenDummy}
      </RequireRole>
    );

    // ASSERT
    const redirectComponent = screen.getByTestId("navigate-mock");
    expect(redirectComponent).toBeInTheDocument();
    expect(redirectComponent).toHaveAttribute("data-to", "/login");
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  // --- CASO 3: ROL INSUFICIENTE (SAD PATH) ---

  it("3. Debe redirigir a la raíz '/' si el usuario no posee ninguno de los roles requeridos", () => {
    // ARRANGE
    // Un Recreador Base (ROLE_MEMBER) intentando acceder a una vista de Mando Supremo (ROLE_ADMIN)
    (useAuth as any).mockReturnValue({
      state: { 
        isAuthenticated: true, 
        user: { roles: ["ROLE_MEMBER"] } 
      },
    });

    // ACT
    render(
      <RequireRole allowedRoles={["ROLE_ADMIN", "ROLE_PRESIDENT"]}>
        {childrenDummy}
      </RequireRole>
    );

    // ASSERT
    const redirectComponent = screen.getByTestId("navigate-mock");
    expect(redirectComponent).toBeInTheDocument();
    expect(redirectComponent).toHaveAttribute("data-to", "/");
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  // --- CASO 4: ACCESO PERMITIDO - ROL ÚNICO (HAPPY PATH) ---

  it("4. Debe renderizar los componentes hijos si el rol del usuario coincide exactamente", () => {
    // ARRANGE
    // Un Administrador entrando a una sección exclusiva de Administradores
    (useAuth as any).mockReturnValue({
      state: { 
        isAuthenticated: true, 
        user: { roles: ["ROLE_ADMIN"] } 
      },
    });

    // ACT
    render(
      <RequireRole allowedRoles={["ROLE_ADMIN"]}>
        {childrenDummy}
      </RequireRole>
    );

    // ASSERT
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.getByText(contenidoProtegidoTexto)).toBeInTheDocument();
    expect(screen.queryByTestId("navigate-mock")).not.toBeInTheDocument();
  });

  // --- CASO 5: ACCESO PERMITIDO - MULTI-ROL (HAPPY PATH) ---

  it("5. Debe permitir el acceso si el usuario tiene múltiples roles y uno de ellos es aceptado", () => {
    // ARRANGE
    // Usuario polimórfico (ej: Presidente que también actúa como Recreador Base)
    (useAuth as any).mockReturnValue({
      state: { 
        isAuthenticated: true, 
        user: { roles: ["ROLE_MEMBER", "ROLE_PRESIDENT"] } 
      },
    });

    // ACT
    render(
      <RequireRole allowedRoles={["ROLE_PRESIDENT"]}>
        {childrenDummy}
      </RequireRole>
    );

    // ASSERT
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate-mock")).not.toBeInTheDocument();
  });
});