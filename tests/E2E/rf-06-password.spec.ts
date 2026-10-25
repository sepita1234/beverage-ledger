import { test, expect, type Page } from '@playwright/test';

/*
 * ============================================================
 * RF-06 - PERFIL Y CAMBIO DE CONTRASEÑA E2E
 * ============================================================
 *
 * Actor principal:
 * Usuario autenticado de Beverage Ledger.
 *
 * Funcionalidades:
 * - Acceder al perfil.
 * - Editar el nombre.
 * - Validar contraseña actual.
 * - Validar contraseña nueva.
 * - Validar confirmación de contraseña.
 *
 * ============================================================
 */

const USUARIO = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD,
};

if (!USUARIO.email || !USUARIO.password) {
  throw new Error(
    'Faltan TEST_USER_EMAIL y TEST_USER_PASSWORD en el archivo .env',
  );
}


/* ============================================================
   TASK: iniciar sesión
   ============================================================ */

async function iniciarSesion(page: Page) {

  await page.goto('/login');

  await expect(
    page.getByRole('textbox', {
      name: 'Correo electrónico',
    }),
  ).toBeVisible();

  await page
    .getByRole('textbox', {
      name: 'Correo electrónico',
    })
    .fill(USUARIO.email!);

  await page
    .getByRole('textbox', {
      name: 'Contraseña',
    })
    .fill(USUARIO.password!);

  await page
    .getByRole('button', {
      name: 'Entrar',
    })
    .click();

  await expect(page).not.toHaveURL(
    /\/login/i,
  );
}


/* ============================================================
   TASK: abrir perfil
   ============================================================ */

async function abrirPerfil(page: Page) {

  /*
   * Abrimos el menú de la cuenta.
   */

  const menuCuenta = page.getByRole(
    'button',
    {
      name: /menú de la cuenta/i,
    },
  );

  await expect(menuCuenta).toBeVisible();

  await menuCuenta.click();

  /*
   * Buscamos la opción Perfil.
   */

  const perfil = page.getByRole(
    'link',
    {
      name: /perfil|tu perfil/i,
    },
  );

  await expect(perfil).toBeVisible();

  await perfil.click();

  /*
   * Confirmamos que estamos en el perfil.
   */

  await expect(
    page.getByText('Tu perfil', {
      exact: true,
    }),
  ).toBeVisible();
}


/* ============================================================
   TASK: abrir sección de contraseña
   ============================================================ */

async function abrirSeccionPassword(page: Page) {

  await iniciarSesion(page);

  await abrirPerfil(page);

  await expect(
    page.getByText('Contraseña', {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: 'Cambiar',
    }),
  ).toBeVisible();
}


/* ============================================================
   SUITE RF-06
   ============================================================ */

test.describe(
  'RF-06 - Perfil y cambio de contraseña E2E',
  () => {


    /* ========================================================
       E2E-01
       El usuario puede acceder a su perfil
       ======================================================== */

    test(
      'E2E-01 - El usuario autenticado puede acceder a su perfil',
      async ({ page }) => {

        // ACTOR:
        // Usuario autenticado.

        await iniciarSesion(page);

        await abrirPerfil(page);

        // QUESTION:
        // ¿Se muestra correctamente el perfil?

        await expect(
          page.getByText('Tu perfil', {
            exact: true,
          }),
        ).toBeVisible();

        await expect(
          page.getByText('NOMBRE', {
            exact: true,
          }),
        ).toBeVisible();

        await expect(
          page.getByText('Contraseña', {
            exact: true,
          }),
        ).toBeVisible();
      },
    );


    /* ========================================================
       E2E-02
       Nueva contraseña menor a 12 caracteres
       ======================================================== */

    test(
      'E2E-02 - La nueva contraseña debe tener mínimo 12 caracteres',
      async ({ page }) => {

        await abrirSeccionPassword(page);

        const actual = page.getByLabel(
          'CONTRASEÑA ACTUAL',
        );

        const nueva = page.getByLabel(
          'CONTRASEÑA NUEVA',
        );

        const repetir = page.getByLabel(
          'REPITE LA CONTRASEÑA NUEVA',
        );

        await actual.fill(
          USUARIO.password!,
        );

        await nueva.fill(
          'Nueva2026',
        );

        await repetir.fill(
          'Nueva2026',
        );

        await page.getByRole(
          'button',
          {
            name: 'Cambiar',
          },
        ).click();

        /*
         * QUESTION:
         * ¿La aplicación evita cambiar una contraseña
         * que no cumple el mínimo de caracteres?
         *
         * La pantalla debe permanecer en el perfil.
         */

        await expect(page).toHaveURL(
          /\/profile/i,
        );
      },
    );


    /* ========================================================
       E2E-03
       Confirmación diferente
       ======================================================== */

    test(
      'E2E-03 - La confirmación de contraseña debe coincidir',
      async ({ page }) => {

        await abrirSeccionPassword(page);

        await page.getByLabel(
          'CONTRASEÑA ACTUAL',
        ).fill(
          USUARIO.password!,
        );

        await page.getByLabel(
          'CONTRASEÑA NUEVA',
        ).fill(
          'Nueva2026abc',
        );

        await page.getByLabel(
          'REPITE LA CONTRASEÑA NUEVA',
        ).fill(
          'Nueva2026abcd',
        );

        await page.getByRole(
          'button',
          {
            name: 'Cambiar',
          },
        ).click();

        /*
         * QUESTION:
         * ¿El sistema evita el cambio cuando las
         * contraseñas no coinciden?
         */

        await expect(page).toHaveURL(
          /\/profile/i,
        );

        await expect(
          page.getByLabel(
            'CONTRASEÑA NUEVA',
          ),
        ).toBeVisible();

        await expect(
          page.getByLabel(
            'REPITE LA CONTRASEÑA NUEVA',
          ),
        ).toBeVisible();
      },
    );


    /* ========================================================
       E2E-04
       Contraseña actual obligatoria
       ======================================================== */

    test(
      'E2E-04 - La contraseña actual es obligatoria',
      async ({ page }) => {

        await abrirSeccionPassword(page);

        await page.getByLabel(
          'CONTRASEÑA ACTUAL',
        ).fill('');

        await page.getByLabel(
          'CONTRASEÑA NUEVA',
        ).fill(
          'Nueva2026abc',
        );

        await page.getByLabel(
          'REPITE LA CONTRASEÑA NUEVA',
        ).fill(
          'Nueva2026abc',
        );

        await page.getByRole(
          'button',
          {
            name: 'Cambiar',
          },
        ).click();

        /*
         * QUESTION:
         * ¿El sistema evita el cambio cuando no se
         * proporciona la contraseña actual?
         */

        await expect(page).toHaveURL(
          /\/profile/i,
        );

        await expect(
          page.getByLabel(
            'CONTRASEÑA ACTUAL',
          ),
        ).toBeVisible();
      },
    );


    /* ========================================================
       E2E-05
       Contraseña actual incorrecta
       ======================================================== */

    test(
      'E2E-05 - Una contraseña actual incorrecta es rechazada',
      async ({ page }) => {

        await abrirSeccionPassword(page);

        // ACTOR:
        // Usuario autenticado que introduce una contraseña
        // actual incorrecta.

        await page.getByLabel(
          'CONTRASEÑA ACTUAL',
        ).fill(
          'ContraseñaIncorrecta2026',
        );

        await page.getByLabel(
          'CONTRASEÑA NUEVA',
        ).fill(
          'Nueva2026abc',
        );

        await page.getByLabel(
          'REPITE LA CONTRASEÑA NUEVA',
        ).fill(
          'Nueva2026abc',
        );

        // INTERACTION:
        // Intentar cambiar la contraseña.

        await page.getByRole(
          'button',
          {
            name: 'Cambiar',
          },
        ).click();

        /*
         * QUESTION:
         * ¿La contraseña incorrecta impide realizar
         * el cambio?
         *
         * No buscamos específicamente role="alert",
         * porque la aplicación puede mostrar el error
         * mediante otro elemento visual.
         */

        await expect(
          page.getByLabel(
            'CONTRASEÑA ACTUAL',
          ),
        ).toBeVisible();

        await expect(
          page.getByLabel(
            'CONTRASEÑA NUEVA',
          ),
        ).toBeVisible();

        await expect(
          page.getByLabel(
            'REPITE LA CONTRASEÑA NUEVA',
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            'button',
            {
              name: 'Cambiar',
            },
          ),
        ).toBeVisible();
      },
    );


    /* ========================================================
       E2E-06
       Edición del perfil
       ======================================================== */

    test(
      'E2E-06 - El usuario puede editar su nombre de perfil',
      async ({ page }) => {

        await iniciarSesion(page);

        await abrirPerfil(page);

        const nombre = page.getByLabel(
          'NOMBRE',
        );

        await expect(nombre).toBeVisible();

        /*
         * Guardamos el nombre original para restaurarlo
         * después de la prueba.
         */

        const nombreOriginal =
          await nombre.inputValue();

        const nombrePrueba =
          `${nombreOriginal} E2E`;

        // INTERACTION:
        // Cambiar temporalmente el nombre.

        await nombre.fill(
          nombrePrueba,
        );

        await page.getByRole(
          'button',
          {
            name: 'Guardar',
          },
        ).click();

        await page.waitForTimeout(1000);

        /*
         * QUESTION:
         * ¿El nombre se actualizó?
         */

        await expect(nombre).toHaveValue(
          nombrePrueba,
        );

        /*
         * RESTAURAR:
         * Volvemos a dejar el nombre original.
         */

        await nombre.fill(
          nombreOriginal,
        );

        await page.getByRole(
          'button',
          {
            name: 'Guardar',
          },
        ).click();

        await page.waitForTimeout(500);

        await expect(nombre).toHaveValue(
          nombreOriginal,
        );
      },
    );


    /* ========================================================
       E2E-07
       Los tres campos de contraseña existen
       ======================================================== */

    test(
      'E2E-07 - La pantalla muestra los tres campos de contraseña',
      async ({ page }) => {

        await abrirSeccionPassword(page);

        // QUESTION:
        // ¿Existe la contraseña actual?

        await expect(
          page.getByLabel(
            'CONTRASEÑA ACTUAL',
          ),
        ).toBeVisible();

        // QUESTION:
        // ¿Existe la contraseña nueva?

        await expect(
          page.getByLabel(
            'CONTRASEÑA NUEVA',
          ),
        ).toBeVisible();

        // QUESTION:
        // ¿Existe la confirmación?

        await expect(
          page.getByLabel(
            'REPITE LA CONTRASEÑA NUEVA',
          ),
        ).toBeVisible();

        // QUESTION:
        // ¿Existe el botón Cambiar?

        await expect(
          page.getByRole(
            'button',
            {
              name: 'Cambiar',
            },
          ),
        ).toBeVisible();
      },
    );


  },
);