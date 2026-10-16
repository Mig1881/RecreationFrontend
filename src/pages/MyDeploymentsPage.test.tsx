import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyDeploymentsPage from "./MyDeploymentsPage";
import { useAuth } from "../context/AuthContext";
import { participationsService } from "../services/participations.service";
import { eventsService } from "../services/events.service";

// 1. CONFIGURACIÓN DE MOCKS GLOBALES
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/participations.service", () => ({
  participationsService: {
    getByMember: vi.fn(),
  },
}));

vi.mock("../services/events.service", () => ({
  eventsService: {
    getAll: vi.fn(),
  },
}));

// Mockeamos el componente QRCodeSVG para no renderizar matemáticas pesadas,
// sino un div simple que podamos rastrear fácilmente
vi.mock("qrcode.react", () => ({
  QRCodeSVG: vi.fn(({ value }) => (
    <svg data-testid="mock-qr-code" data-value={value}></svg>
  )),
}));

describe("Página: MyDeploymentsPage", () => {
  const mockUserId = 101;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuramos un usuario por defecto para todos los tests
    (useAuth as any).mockReturnValue({
      state: { user: { id: mockUserId } },
    });
  });

  // --- SECCIÓN 1: ESTADO DE CARGA Y VACÍO ---

  it("1. Debe mostrar el estado de carga al inicializarse", () => {
    // Retrasamos intencionadamente la resolución de las promesas
    (participationsService.getByMember as any).mockReturnValue(new Promise(() => {}));
    (eventsService.getAll as any).mockReturnValue(new Promise(() => {}));

    render(<MyDeploymentsPage />);
    
    expect(screen.getByText("Imprimiendo pases de batalla...")).toBeInTheDocument();
  });

  it("2. Debe mostrar el mensaje de 'No tienes órdenes' si el backend devuelve un array vacío", async () => {
    (participationsService.getByMember as any).mockResolvedValue([]);
    (eventsService.getAll as any).mockResolvedValue([]);

    render(<MyDeploymentsPage />);

    await waitFor(() => {
      expect(screen.getByText("No tienes órdenes de despliegue activas.")).toBeInTheDocument();
    });
  });

  // --- SECCIÓN 2: RENDERIZADO DE DESPLIEGUES ---

  it("3. Debe renderizar correctamente un Despliegue Próximo y un Expediente Archivado", async () => {
    const today = new Date();
    
    // Calculamos una fecha pasada (hace 10 días)
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 10);
    
    // Calculamos una fecha futura (dentro de 10 días)
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);

    const mockEvents = [
      { id: 1, city: "Bailén", startDate: pastDate.toISOString(), endDate: pastDate.toISOString() },
      { id: 2, city: "Zaragoza", startDate: futureDate.toISOString(), endDate: futureDate.toISOString() },
    ];

    const mockParticipations = [
      { id: 10, eventId: 1, eventCode: "EVT-BAILEN", carriedWeapon: "Mosquete Brown Bess", weaponModel: "1795" },
      { id: 20, eventId: 2, eventCode: "EVT-ZARAGOZA", carriedWeapon: "Fusil Charleville", weaponModel: "1777" },
    ];

    (eventsService.getAll as any).mockResolvedValue(mockEvents);
    (participationsService.getByMember as any).mockResolvedValue(mockParticipations);

    render(<MyDeploymentsPage />);

    await waitFor(() => {
      expect(screen.getByText("Mis Despliegues")).toBeInTheDocument();
    });

    // Verificamos el evento futuro
    expect(screen.getByText("EVT-ZARAGOZA")).toBeInTheDocument();
    expect(screen.getByText("Zaragoza")).toBeInTheDocument();
    expect(screen.getByText("Fusil Charleville")).toBeInTheDocument();
    expect(screen.getByText("Próximo Despliegue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mostrar Pase QR/i })).toBeInTheDocument();

    // Verificamos el evento pasado
    expect(screen.getByText("EVT-BAILEN")).toBeInTheDocument();
    expect(screen.getByText("Bailén")).toBeInTheDocument();
    expect(screen.getByText("Campaña Finalizada")).toBeInTheDocument();
    expect(screen.getByText("Expediente Archivado")).toBeInTheDocument();
  });

  // --- SECCIÓN 3: INTERACCIÓN CON EL MODAL QR ---

  it("4. Debe abrir el modal y renderizar el QRCodeSVG con el token correcto al hacer clic", async () => {
    const user = userEvent.setup();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulado";

    (eventsService.getAll as any).mockResolvedValue([
      { id: 1, city: "Arapiles", startDate: futureDate.toISOString(), endDate: futureDate.toISOString() }
    ]);
    
    (participationsService.getByMember as any).mockResolvedValue([
      { 
        id: 10, 
        eventId: 1, 
        eventCode: "EVT-ARAPILES", 
        memberFullName: "General Castaños",
        qrToken: mockToken
      }
    ]);

    render(<MyDeploymentsPage />);

    // Esperamos a que cargue la interfaz
    await waitFor(() => {
      expect(screen.getByText("EVT-ARAPILES")).toBeInTheDocument();
    });

    // 1. Verificamos que el modal NO está abierto inicialmente
    expect(screen.queryByText("Control de Acceso")).not.toBeInTheDocument();

    // 2. Abrimos el modal
    await user.click(screen.getByRole("button", { name: /Mostrar Pase QR/i }));

// 3. Verificamos que el modal se ha abierto con los datos correctos
    expect(screen.getByText("Control de Acceso")).toBeInTheDocument();
    expect(screen.getByText("General Castaños")).toBeInTheDocument();
    // Como el texto está en la tarjeta de fondo y en el modal, usamos getAllByText
    expect(screen.getAllByText("Arapiles").length).toBe(2);

    // 4. Comprobamos la inyección del QR mediante nuestro Mock
    const qrSvg = screen.getByTestId("mock-qr-code");
    expect(qrSvg).toBeInTheDocument();
    expect(qrSvg).toHaveAttribute("data-value", mockToken);

    // 5. Cerramos el modal
    // Como usamos lucide-react y no hay texto en el botón de cerrar, 
    // buscamos el botón más cercano al título "Control de Acceso"
    const closeButton = screen.getByText("Control de Acceso").nextElementSibling as HTMLElement;
    await user.click(closeButton);

    // 6. Verificamos que se ha cerrado
    expect(screen.queryByText("Control de Acceso")).not.toBeInTheDocument();
  });
});