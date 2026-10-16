import { test, expect } from '@playwright/test';

test.describe('Mando Central - Operaciones E2E', () => {

  const codigoUnicoCampana = `EVT-${Date.now().toString().slice(-6)}`;

  // --- FLUJO 1: CREACIÓN DE CAMPAÑA (INDEPENDENCIA DE ESTADO TOTAL) ---
  test('1. Mando Supremo: Creación de Asociación y posterior creación de Campaña', async ({ page }) => {
    // Aumentamos un poco el timeout al hacer dos inserciones
    test.setTimeout(45000);

    // 1. LOGIN
    await page.goto('/login');
    await page.getByLabel('Correo Electrónico').fill('admin@ane.es'); 
    await page.getByLabel('Contraseña').fill('admin123');             
    await page.getByRole('button', { name: 'Entrar a la Base' }).click();
    await page.waitForURL('**/'); 

    // Generamos marcas de tiempo para evitar colisiones
    const timestamp = Date.now().toString();
    const nombreAsociacionBase = `Regimiento Base ${timestamp.slice(-6)}`;
    const codigoUnicoCampana = `EVT-${timestamp.slice(-6)}`;

    // ==========================================
    // FASE PREVIA: CREAR ASOCIACIÓN OBLIGATORIA
    // ==========================================
    await page.getByRole('link', { name: 'Gestión de Asociaciones', exact: true }).click();
    await page.getByRole('button', { name: 'Registrar Asociación' }).click();

    await page.locator('input[name="name"]').fill(nombreAsociacionBase);
    await page.locator('input[name="taxId"]').fill(`CIF-${timestamp.slice(-6)}`);
    await page.locator('input[name="foundationYear"]').fill('1808');
    await page.locator('input[name="city"]').fill('Zaragoza');
    
    await page.getByRole('button', { name: 'Guardar Expediente' }).click();
    await expect(page.getByText('Nueva asociación registrada')).toBeVisible();

    // ==========================================
    // FASE PRINCIPAL: CREAR LA CAMPAÑA
    // ==========================================
    await page.getByRole('link', { name: 'Gestión de Campañas', exact: true }).click();
    await page.getByRole('button', { name: /Programar Campaña/i }).click();

    await page.locator('input[name="eventCode"]').fill(codigoUnicoCampana);
    
    //La seleccionamos por su nombre exacto.
    await page.locator('select[name="organizingAssociationId"]').selectOption({ label: nombreAsociacionBase });
    
    await page.locator('input[name="publicEntity"]').fill('Diputación Provincial');
    await page.locator('input[name="subsidy"]').fill('500');
    await page.locator('input[name="country"]').fill('España');
    await page.locator('input[name="city"]').fill('Zaragoza');
    await page.locator('input[name="startDate"]').fill('2026-10-12'); 
    await page.locator('input[name="endDate"]').fill('2026-10-14');
    
    await page.getByRole('button', { name: 'Emitir Orden de Campaña' }).click();

    // ASERCIONES
    await expect(page.getByText('Nueva campaña programada')).toBeVisible();
    const filaTabla = page.locator('tr').filter({ hasText: codigoUnicoCampana });
    await expect(filaTabla).toBeVisible();
  });

  // --- FLUJO 2: CONTROL DE SEGURIDAD LOGIN (SAD PATH) ---
  test('2. Seguridad: Intento de acceso con credenciales erróneas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo Electrónico').fill('espia@frances.es');
    await page.getByLabel('Contraseña').fill('clavefalsa');
    await page.getByRole('button', { name: 'Entrar a la Base' }).click();

    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  // --- FLUJO 3: REDIRECCIÓN POR FALTA DE SESIÓN (RBAC PERIMETRAL) ---
  test('3. Seguridad: Usuario anónimo intentando acceder a una ruta protegida', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  // --- FLUJO 4: EL VIAJE MAESTRO (Data Independence) ---
  test('4. Flujo Maestro: Admin crea Asociación y Presidente, Presidente recluta Tropa', async ({ page }) => {
    // 60 segundos de Timeout para permitir el ciclo completo
    test.setTimeout(60000); 

    // Generadores de entropía para asegurar datos únicos en cada ejecución
    const timestamp = Date.now().toString();
    const nombreAsociacion = `Regimiento Voluntarios ${timestamp.slice(-6)}`;
    const cifAsociacion = `G${timestamp.slice(-8)}`;
    
    const correoPresidente = `general_${timestamp}@ane.es`;
    const dniPresidente = `P${timestamp.slice(-8)}`;
    
    const correoSoldado = `soldado_${timestamp}@ane.es`;
    const dniSoldado = `S${timestamp.slice(-8)}`;

    // ==========================================
    // FASE A: EL ADMIN CREA LA ASOCIACIÓN
    // ==========================================
    await page.goto('/login');
    await page.getByLabel('Correo Electrónico').fill('admin@ane.es'); 
    await page.getByLabel('Contraseña').fill('admin123');             
    await page.getByRole('button', { name: 'Entrar a la Base' }).click();
    await page.waitForURL('**/');

    await page.getByRole('link', { name: 'Gestión de Asociaciones', exact: true }).click();
    await page.getByRole('button', { name: 'Registrar Asociación' }).click();

    // Rellenamos datos de la nueva Asociación
    await page.locator('input[name="name"]').fill(nombreAsociacion);
    await page.locator('input[name="taxId"]').fill(cifAsociacion);
    await page.locator('input[name="foundationYear"]').fill('1808');
    await page.locator('input[name="allegiance"]').fill('Ejército Español');
    await page.locator('input[name="city"]').fill('Zaragoza');
    
    await page.getByRole('button', { name: 'Guardar Expediente' }).click();
    await expect(page.getByText('Nueva asociación registrada')).toBeVisible();

    // ==========================================
    // FASE B: EL ADMIN ALISTA AL PRESIDENTE EN LA NUEVA ASOCIACIÓN
    // ==========================================
    await page.getByRole('link', { name: 'Recreadores', exact: true }).click();
    
    // El Admin selecciona LA ASOCIACIÓN EXACTA que acaba de crear
    await page.locator('select').first().selectOption({ label: nombreAsociacion });
    
    // Breve pausa para asegurar que el estado de React se actualiza tras el selectOption
    await page.waitForTimeout(500); 
    
    await page.getByRole('button', { name: 'Alistar Nuevo Recreador' }).click();

    // Rellenamos el Presidente
    await page.getByLabel('Nombre').fill('General');
    await page.getByLabel('Apellidos').fill('Palafox');
    await page.getByLabel('DNI / Pasaporte').fill(dniPresidente);
    await page.getByLabel('Correo Electrónico').fill(correoPresidente);
    await page.getByLabel('Contraseña Provisional').fill('defensa1808');
    
    // Elevamos sus privilegios a Presidente
    await page.locator('select[name="role"]').selectOption('president');
    
    await page.getByRole('button', { name: 'Aprobar Alistamiento' }).click();
    await expect(page.getByText('Gestión de Alistamientos')).not.toBeVisible(); 

    // ==========================================
    // FASE C: CAMBIO DE SESIÓN (Log Out Admin -> Log In Presidente)
    // ==========================================
    await page.getByRole('button', { name: 'Abandonar la Base' }).click();
    await expect(page).toHaveURL(/.*\/login/);

    await page.getByLabel('Correo Electrónico').fill(correoPresidente); 
    await page.getByLabel('Contraseña').fill('defensa1808');
    await page.getByRole('button', { name: 'Entrar a la Base' }).click();
    await page.waitForURL('**/');

    // ==========================================
    // FASE D: EL PRESIDENTE RECLUTA A LA TROPA
    // ==========================================
    await page.getByRole('link', { name: 'Recreadores', exact: true }).click();
    
    await page.getByRole('button', { name: 'Alistar Nuevo Recreador' }).click();

    await page.getByLabel('Nombre').fill('Agustina');
    await page.getByLabel('Apellidos').fill('Zaragoza y Doménech');
    await page.getByLabel('DNI / Pasaporte').fill(dniSoldado);
    await page.getByLabel('Correo Electrónico').fill(correoSoldado);
    await page.getByLabel('Contraseña Provisional').fill('canonazo1808');

    await page.getByRole('button', { name: 'Aprobar Alistamiento' }).click();
    await expect(page.getByText('Gestión de Alistamientos')).not.toBeVisible();

    // ==========================================
    // FASE E: ASERCIÓN FINAL
    // ==========================================
    // Comprobamos que el soldado raso está en la tabla, validando que todo el árbol de relaciones funcionó
    const nuevaFila = page.locator('tr').filter({ hasText: 'Agustina Zaragoza' });
    await expect(nuevaFila).toBeVisible();
  });

});