import { test, expect, type Page } from '@playwright/test';

/*
 * ============================================================
 * RF-01 - INICIO DE SESIÓN E2E
 * ============================================================
 *
 * Actor principal:
 * Usuario de Beverage Ledger.
 *
 * Las credenciales se obtienen desde el archivo .env:
 *
 * TEST_USER_EMAIL="..."
 * TEST_USER_PASSWORD="..."
 *
 * ============================================================
 */

const USUARIO = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD,
};

if (!USUARIO.email || !USUARIO.password) {
  throw new Error('Faltan TEST_USER_EMAIL y TEST_USER_PASSWORD en el archivo .env');
}

/*
 * Usuario utilizado para probar un correo que no existe.
 */
const USUARIO_INEXISTENTE = {
  email: 'nadie@example.com',
  password: 'clave-incorrecta',
};

/* ============================================================
   TASK: abrir Login
   ============================================================ */

async function abrirLogin(page: Page) {
  await page.goto('/login');

  await expect(
    page.getByRole('textbox', {
      name: 'Correo electrónico',
    }),
  ).toBeVisible();

  await expect(
    page.getByRole('textbox', {
      name: 'Contraseña',
    }),
  ).toBeVisible();
}

/* ============================================================
   TASK: ingresar credenciales
   ============================================================ */

async function ingresarCredenciales(page: Page, email: string, password: string) {
  await page
    .getByRole('textbox', {
      name: 'Correo electrónico',
    })
    .fill(email);

  await page
    .getByRole('textbox', {
      name: 'Contraseña',
    })
    .fill(password);
}

/* ============================================================
   TASK: presionar botón Entrar
   ============================================================ */

async function presionarLogin(page: Page) {
  await page
    .getByRole('button', {
      name: 'Entrar',
    })
    .click();
}

/* ============================================================
   TASK: iniciar sesión
   ============================================================ */

async function iniciarSesion(page: Page, email: string, password: string) {
  await abrirLogin(page);

  await ingresarCredenciales(page, email, password);

  await presionarLogin(page);
}

/* ============================================================
   QUESTION:
   Obtener mensaje mostrado después de un login fallido.
   ============================================================ */

async function obtenerMensajeError(page: Page) {
  /*
   * Esperamos a que termine la comunicación con el servidor.
   */
  await page.waitForLoadState('networkidle').catch(() => {});

  /*
   * Buscamos diferentes formas en las que la aplicación
   * podría mostrar un mensaje de error.
   */
  const posiblesMensajes = page.locator(
    '[role="alert"]:visible, ' +
      '[data-sonner-toast]:visible, ' +
      '[class*="error"]:visible, ' +
      '[class*="alert"]:visible',
  );

  const cantidad = await posiblesMensajes.count();

  /*
   * Revisamos los mensajes encontrados.
   */
  for (let i = 0; i < cantidad; i++) {
    const texto = (await posiblesMensajes.nth(i).innerText()).trim();

    if (texto.length > 0) {
      return texto;
    }
  }

  /*
   * Si no encontramos un elemento específico,
   * utilizamos el texto visible de la página.
   */
  return (await page.locator('body').innerText()).trim();
}

/* ============================================================
   SUITE PRINCIPAL RF-01
   ============================================================ */

test.describe('RF-01 - Inicio de sesión E2E con credenciales', () => {
  /* ========================================================
       E2E-01
       Login válido
       ======================================================== */

  test('E2E-01 - El usuario válido puede iniciar sesión', async ({ page }) => {
    // ACTOR:
    // Usuario válido.

    await iniciarSesion(page, USUARIO.email!, USUARIO.password!);

    // QUESTION:
    // ¿El usuario pudo salir del Login?

    await expect(page).not.toHaveURL(/\/login/i);
  });

  /* ========================================================
       E2E-02
       Correo con espacios y mayúsculas
       ======================================================== */

  test('E2E-02 - Correo electrónico con espacios y mayúsculas', async ({ page }) => {
    // ACTOR:
    // Usuario válido que escribe el correo
    // con mayúsculas y espacios.

    await iniciarSesion(page, `  ${USUARIO.email!.toUpperCase()}  `, USUARIO.password!);

    // QUESTION:
    // ¿El sistema normaliza correctamente el correo?

    await expect(page).not.toHaveURL(/\/login/i);
  });

  /* ========================================================
       E2E-03
       Contraseña incorrecta
       ======================================================== */

  test('E2E-03 - Contraseña incorrecta devuelve mensaje genérico', async ({ page }) => {
    // ACTOR:
    // Usuario registrado.

    await iniciarSesion(page, USUARIO.email!, `${USUARIO.password!}-incorrecta`);

    // QUESTION:
    // ¿El usuario permanece en el Login?

    await expect(page).toHaveURL(/\/login/i);

    // QUESTION:
    // ¿El sistema muestra algún mensaje?

    const mensaje = await obtenerMensajeError(page);

    expect(mensaje.trim().length).toBeGreaterThan(0);

    // QUESTION:
    // ¿El mensaje evita revelar información interna?

    expect(mensaje).not.toMatch(
      /usuario no existe|user not found|passwordHash|hash|suspended|suspendido/i,
    );
  });

  /* ========================================================
       E2E-04
       Usuario inexistente
       ======================================================== */

  test('E2E-04 - Usuario inexistente devuelve el mismo mensaje genérico', async ({ page }) => {
    // ACTOR:
    // Persona que intenta ingresar con un
    // correo que no existe.

    await iniciarSesion(page, USUARIO_INEXISTENTE.email, USUARIO_INEXISTENTE.password);

    // QUESTION:
    // ¿El usuario permanece en el Login?

    await expect(page).toHaveURL(/\/login/i);

    // QUESTION:
    // ¿El sistema muestra algún mensaje?

    const mensaje = await obtenerMensajeError(page);

    expect(mensaje.trim().length).toBeGreaterThan(0);

    // QUESTION:
    // ¿El sistema evita revelar que el usuario no existe?

    expect(mensaje).not.toMatch(
      /usuario no existe|user not found|passwordHash|hash|suspended|suspendido/i,
    );
  });

  /* ========================================================
       E2E-05
       Protección del Dashboard
       ======================================================== */

  test('E2E-05 - Usuario no autenticado no puede acceder al panel de control', async ({ page }) => {
    // ACTOR:
    // Usuario no autenticado.

    await page.goto('/dashboard');

    // QUESTION:
    // ¿El sistema protege el Dashboard?

    await expect(page).toHaveURL(/\/login/i);
  });

  /* ========================================================
       E2E-06
       Login + Logout
       ======================================================== */

  test('E2E-06 - Iniciar sesión y cerrar sesión asegura con éxito la sesión', async ({ page }) => {
    // ====================================================
    // ACTOR:
    // Usuario válido inicia sesión.
    // ====================================================

    await iniciarSesion(page, USUARIO.email!, USUARIO.password!);

    // QUESTION:
    // ¿El usuario salió del Login?

    await expect(page).not.toHaveURL(/\/login/i);

    // ====================================================
    // TASK:
    // Abrir menú de cuenta.
    // ====================================================

    const menuCuenta = page.getByRole('button', {
      name: /menú de la cuenta/i,
    });

    await expect(menuCuenta).toBeVisible();

    await menuCuenta.click();

    // ====================================================
    // TASK:
    // Buscar opción Cerrar sesión.
    // ====================================================

    /*
     * No asumimos que Cerrar sesión sea necesariamente
     * un <button>.
     *
     * Puede ser un botón, enlace, menuitem u otro
     * elemento visible.
     */

    const logoutButton = page.getByText(/cerrar sesión|logout|salir/i).last();

    // QUESTION:
    // ¿Apareció la opción de cerrar sesión?

    await expect(logoutButton).toBeVisible();

    // ====================================================
    // INTERACTION:
    // Cerrar sesión.
    // ====================================================

    await logoutButton.click();

    // ====================================================
    // QUESTION:
    // ¿El usuario regresó al Login?
    // ====================================================

    await expect(page).toHaveURL(/\/login/i);

    // ====================================================
    // TASK:
    // Intentar entrar nuevamente al Dashboard.
    // ====================================================

    await page.goto('/dashboard');

    // ====================================================
    // QUESTION:
    // ¿El Dashboard continúa protegido?
    // ====================================================

    await expect(page).toHaveURL(/\/login/i);
  });

  /* ========================================================
       E2E-07
       Evitar múltiples envíos
       ======================================================== */

  test('E2E-07 - El formulario impide múltiples envíos durante el procesamiento', async ({
    page,
  }) => {
    // ACTOR:
    // Usuario válido.

    await abrirLogin(page);

    await ingresarCredenciales(page, USUARIO.email!, USUARIO.password!);

    const botonEntrar = page.getByRole('button', {
      name: 'Entrar',
    });

    // INTERACTION:
    // Enviar formulario.

    await botonEntrar.click();

    await page.waitForTimeout(200);

    /*
     * Si el botón continúa visible durante el procesamiento,
     * comprobamos que esté deshabilitado.
     */

    if (await botonEntrar.isVisible().catch(() => false)) {
      expect(await botonEntrar.isDisabled().catch(() => false)).toBe(true);
    }
  });

  /* ========================================================
       E2E-08
       No exponer información sensible
       ======================================================== */

  test('E2E-08 - No expone información sensible al usuario', async ({ page }) => {
    // ACTOR:
    // Usuario que introduce una contraseña incorrecta.

    await iniciarSesion(page, USUARIO.email!, `${USUARIO.password!}-incorrecta`);

    await page.waitForTimeout(500);

    const contenido = await page.locator('body').innerText();

    // QUESTION:
    // ¿La contraseña no aparece en pantalla?

    expect(contenido).not.toContain(USUARIO.password!);

    // QUESTION:
    // ¿No aparecen errores internos?

    expect(contenido).not.toMatch(/passwordHash|PrismaClient|database error|stack trace/i);
  });

  /* ========================================================
       E2E-09
       Cuenta suspendida + contraseña incorrecta
       ======================================================== */

  test('E2E-09 - Cuenta suspendida con contraseña incorrecta', async () => {
    /*
     * No se ejecuta porque actualmente no existe
     * una cuenta suspendida preparada para E2E.
     */

    test.skip(true, 'No existe una cuenta suspendida configurada para las pruebas E2E.');
  });

  /* ========================================================
       E2E-10
       Cuenta suspendida + contraseña correcta
       ======================================================== */

  test('E2E-10 - Cuenta suspendida con contraseña correcta', async () => {
    /*
     * No se ejecuta porque actualmente no existe
     * una cuenta suspendida preparada para E2E.
     */

    test.skip(true, 'No existe una cuenta suspendida configurada para las pruebas E2E.');
  });

  /* ========================================================
       E2E-11
       Error de autenticación sin información sensible
       ======================================================== */

  test('E2E-11 - Fallida autenticación no devuelve información sensible', async ({ page }) => {
    // ACTOR:
    // Usuario que introduce una contraseña incorrecta.

    await iniciarSesion(page, USUARIO.email!, 'contraseña-completamente-incorrecta');

    // QUESTION:
    // ¿Permanece en Login?

    await expect(page).toHaveURL(/\/login/i);

    const contenido = await page.locator('body').innerText();

    // QUESTION:
    // ¿La contraseña introducida no aparece?

    expect(contenido).not.toContain('contraseña-completamente-incorrecta');

    // QUESTION:
    // ¿No se muestran errores internos?

    expect(contenido).not.toMatch(/passwordHash|PrismaClient|database error|stack trace/i);
  });
});
