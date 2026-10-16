import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecruitModal from "./RecruitModal";
import { membersService } from "../../services/members.service";
import { membershipsService } from "../../services/memberships.service";

// 1. CONFIGURACIÓN DE MOCKS GLOBALES
vi.mock("../../services/members.service", () => ({
  membersService: {
    create: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock("../../services/memberships.service", () => ({
  membershipsService: {
    enroll: vi.fn(),
  },
}));

describe("Componente UI: RecruitModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockAssociationId = 1808;

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    associationId: mockAssociationId,
    isAdmin: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- SECCIÓN 1: RENDERIZADO BÁSICO Y PESTAÑAS ---

  it("1. No debe renderizar nada si isOpen es false", () => {
    render(<RecruitModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Gestión de Alistamientos")).not.toBeInTheDocument();
  });

  it("2. Debe cambiar el formulario visible al alternar entre pestañas", async () => {
    const user = userEvent.setup();
    render(<RecruitModal {...defaultProps} />);

    // Por defecto, debe mostrar el formulario de Nuevo Recluta
    expect(screen.getByText("Datos Personales Obligatorios")).toBeInTheDocument();
    expect(screen.queryByText("Identificación de Veterano")).not.toBeInTheDocument();

    // Hacemos clic en la pestaña "Vincular Veterano"
    await user.click(screen.getByRole("button", { name: /Vincular Veterano/i }));

    // Ahora debe mostrar el formulario del veterano
    expect(screen.getByText("Identificación de Veterano")).toBeInTheDocument();
    expect(screen.queryByText("Datos Personales Obligatorios")).not.toBeInTheDocument();
  });

  // --- SECCIÓN 2: FLUJO DE NUEVO RECLUTA ---

  it("3. Debe enviar los datos del nuevo recluta y llamar a onSuccess en caso de éxito", async () => {
    const user = userEvent.setup();
    render(<RecruitModal {...defaultProps} />);

    // Simulamos que el backend responde con éxito creando un usuario con ID 99
    (membersService.create as any).mockResolvedValue({ id: 99 });
    (membershipsService.enroll as any).mockResolvedValue({});

    // Rellenamos el formulario básico
    await user.type(screen.getByLabelText(/Nombre/i), "Agustina");
    await user.type(screen.getByLabelText(/Apellidos/i), "Zaragoza");
    await user.type(screen.getByLabelText(/DNI/i), "12345678A");
    await user.type(screen.getByLabelText(/Correo/i), "agustina@aragon.es");
    await user.type(screen.getByLabelText(/Contraseña/i), "canonazo1808");

    // Enviamos el formulario
    await user.click(screen.getByRole("button", { name: /Aprobar Alistamiento/i }));

    // Verificamos el flujo de llamadas
    await waitFor(() => {
      expect(membersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: "Agustina", nationalId: "12345678A" })
      );
      expect(membershipsService.enroll).toHaveBeenCalledWith({
        associationId: mockAssociationId,
        memberId: 99,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

it("4. Debe capturar errores de duplicidad (409) y mostrar el aviso amigable al crear un nuevo recluta", async () => {
    const user = userEvent.setup();
    render(<RecruitModal {...defaultProps} />);

    // Simulamos un error 409 del backend
    (membersService.create as any).mockRejectedValue(new Error("Error: El campo único de DNI ya existe."));

    // Rellenamos TODOS los campos requeridos para que el HTML permita el Submit
    await user.type(screen.getByLabelText(/Nombre/i), "Intruso");
    await user.type(screen.getByLabelText(/Apellidos/i), "Falso");
    await user.type(screen.getByLabelText(/DNI/i), "00000000X");
    await user.type(screen.getByLabelText(/Correo/i), "falso@falso.com");
    await user.type(screen.getByLabelText(/Contraseña/i), "12345678");

    await user.click(screen.getByRole("button", { name: /Aprobar Alistamiento/i }));

    // Verificamos que el error se renderiza en la alerta roja
    await waitFor(() => {
      expect(screen.getByText(/selecciona la pestaña "Vincular Veterano"/i)).toBeInTheDocument();
    });
    // Validamos que NO se intentó enrolar a nadie y NO se disparó el éxito
    expect(membershipsService.enroll).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  // --- SECCIÓN 3: FLUJO DE VINCULACIÓN DE VETERANO ---

  it("5. Debe buscar al veterano por DNI y vincularlo a la asociación si existe", async () => {
    const user = userEvent.setup();
    render(<RecruitModal {...defaultProps} />);

    // Preparamos el entorno para la pestaña de veterano
    await user.click(screen.getByRole("button", { name: /Vincular Veterano/i }));

    // Simulamos el catálogo del backend
    const mockCatologo = [
      { id: 10, nationalId: "99999999Z" },
      { id: 42, nationalId: "11111111H" }, // El veterano objetivo
    ];
    (membersService.getAll as any).mockResolvedValue(mockCatologo);
    (membershipsService.enroll as any).mockResolvedValue({});

    // Escribimos el DNI a buscar (comprobando que el .toUpperCase del componente funciona)
    const inputDni = screen.getByPlaceholderText("Ej: 12345678Z");
    await user.type(inputDni, "11111111h"); 

    await user.click(screen.getByRole("button", { name: /Vincular a mi Regimiento/i }));

    await waitFor(() => {
      // Verificamos que encontró al ID 42 y lo vinculó
      expect(membershipsService.enroll).toHaveBeenCalledWith({
        associationId: mockAssociationId,
        memberId: 42,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("6. Debe mostrar un error si el veterano no existe en la base de datos", async () => {
    const user = userEvent.setup();
    render(<RecruitModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Vincular Veterano/i }));

    (membersService.getAll as any).mockResolvedValue([{ id: 10, nationalId: "99999999Z" }]);

    await user.type(screen.getByPlaceholderText("Ej: 12345678Z"), "00000000X"); 
    await user.click(screen.getByRole("button", { name: /Vincular a mi Regimiento/i }));

    await waitFor(() => {
      expect(screen.getByText("No consta ningún recreador con este DNI en los archivos del Cuartel General.")).toBeInTheDocument();
    });
  });

  // --- SECCIÓN 4: RENDERIZADO CONDICIONAL DE ROLES ---

  it("7. Debe mostrar los privilegios de sistema solo si el usuario es Admin", () => {
    const { unmount } = render(<RecruitModal {...defaultProps} isAdmin={false} />);
    expect(screen.queryByText(/Privilegios de Sistema/i)).not.toBeInTheDocument();
    
    unmount(); // Limpiamos el DOM

    render(<RecruitModal {...defaultProps} isAdmin={true} />);
    expect(screen.getByText(/Privilegios de Sistema/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // El select de roles
  });
});