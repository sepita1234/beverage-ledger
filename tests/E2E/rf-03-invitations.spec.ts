import { test, expect, type Page } from '@playwright/test';

/*
 * ============================================================
 * RF-03 - ACEPTAR INVITACIÓN E2E
 * ============================================================
 *
 * Actor:
 * Usuario que recibe una invitación para ingresar
 * a Beverage Ledger.
 *
 * ============================================================
 */

const INVITATION_URL = process.env.TEST_INVITE_URL;

if (!INVITATION_URL) {
  throw new Error(
    'Falta TEST_INVITE_URL en el archivo .env',
  );
}


/* ============================================================
   TASK: abrir invitación
   ============================================================ */

async function abrirInvitacion(page: Page) {

  await page.goto(INVITATION_URL!, {
    waitUntil: 'domcontentloaded',
  });

  /*
   * Esperamos directamente los elementos del formulario.
   * Esto es más estable que buscar los textos de las etiquetas.
   */

  await expect(
    page.locator('input').first(),
  ).toBeVisible({
    timeout: 15000,
  });

  await expect(
    page.getByRole('button', {
      name: /crear mi cuenta/i,
    }),
  ).toBeVisible({
    timeout: 15000,
  });
}


/* ============================================================
   TASK: campo nombre
   ============================================================ */

function campoNombre(page: Page) {
  return page.locator('input').first();
}


/* ============================================================
   TASK: campo contraseña
   ============================================================ */

function campoPassword(page: Page) {
  return page.locator('input').nth(1);
}


/* ============================================================
   RF-03
   ============================================================ */

test.describe(
  'RF-03 - Aceptar invitación E2E',
  () => {


    /* ========================================================
       E2E-01
       La invitación muestra el formulario
       ======================================================== */

    test(
      'E2E-01 - La invitación muestra correctamente el formulario',
      async ({ page }) => {

        await abrirInvitacion(page);

        // QUESTION:
        // ¿Existe el campo para escribir el nombre?

        await expect(
          campoNombre(page),
        ).toBeVisible();

        // QUESTION:
        // ¿Existe el campo para escribir la contraseña?

        await expect(
          campoPassword(page),
        ).toBeVisible();

        // QUESTION:
        // ¿Existe el botón para crear la cuenta?

        await expect(
          page.getByRole('button', {
            name: /crear mi cuenta/i,
          }),
        ).toBeVisible();
      },
    );


    /* ========================================================
       E2E-02
       Nombre obligatorio
       ======================================================== */

    test(
      'E2E-02 - El nombre es obligatorio',
      async ({ page }) => {

        await abrirInvitacion(page);

        await campoNombre(page).fill('');

        await campoPassword(page).fill(
          'Inventario2026',
        );

        await page.getByRole('button', {
          name: /crear mi cuenta/i,
        }).click();

        /*
         * El navegador o la aplicación debe impedir
         * el envío de un nombre vacío.
         */

        await expect(
          campoNombre(page),
        ).toBeVisible();

        await expect(
          page.getByRole('button', {
            name: /crear mi cuenta/i,
          }),
        ).toBeVisible();
      },
    );


    /* ========================================================
       E2E-03
       Nombre demasiado corto
       ======================================================== */

    test(
      'E2E-03 - El nombre demasiado corto es rechazado',
      async ({ page }) => {

        await abrirInvitacion(page);

        await campoNombre(page).fill('A');

        await campoPassword(page).fill(
          'Inventario2026',
        );

        await page.getByRole('button', {
          name: /crear mi cuenta/i,
        }).click();

        /*
         * El formulario debe continuar en la pantalla
         * de invitación porque el nombre no es válido.
         */

        await expect(
          page.getByRole('button', {
            name: /crear mi cuenta/i,
          }),
        ).toBeVisible();

        await expect(page).toHaveURL(
          /\/invite\//i,
        );
      },
    );


    /* ========================================================
       E2E-04
       Contraseña obligatoria
       ======================================================== */

    test(
      'E2E-04 - La contraseña es obligatoria',
      async ({ page }) => {

        await abrirInvitacion(page);

        await campoNombre(page).fill(
          'Ana Restrepo',
        );

        await campoPassword(page).fill('');

        await page.getByRole('button', {
          name: /crear mi cuenta/i,
        }).click();

        /*
         * La cuenta no debe crearse con contraseña vacía.
         */

        await expect(
          page.getByRole('button', {
            name: /crear mi cuenta/i,
          }),
        ).toBeVisible();

        await expect(page).toHaveURL(
          /\/invite\//i,
        );
      },
    );


    /* ========================================================
       E2E-05
       Contraseña inválida
       ======================================================== */

    test(
      'E2E-05 - La contraseña debe cumplir las reglas de seguridad',
      async ({ page }) => {

        await abrirInvitacion(page);

        await campoNombre(page).fill(
          'Ana Restrepo',
        );

        await campoPassword(page).fill(
          'abc',
        );

        await page.getByRole('button', {
          name: /crear mi cuenta/i,
        }).click();

        /*
         * Una contraseña que no cumple los requisitos
         * no debe permitir crear la cuenta.
         */

        await expect(
          page.getByRole('button', {
            name: /crear mi cuenta/i,
          }),
        ).toBeVisible();

        await expect(page).toHaveURL(
          /\/invite\//i,
        );
      },
    );


    /* ========================================================
       E2E-06
       Espacios en el nombre
       ======================================================== */

    test(
      'E2E-06 - El formulario permite escribir el nombre con espacios',
      async ({ page }) => {

        await abrirInvitacion(page);

        const nombre = campoNombre(page);

        await nombre.fill('  Ana  ');

        /*
         * Comprobamos que el formulario recibió exactamente
         * el texto escrito por el usuario.
         */

        await expect(nombre).toHaveValue(
          '  Ana  ',
        );
      },
    );


    /* ========================================================
       E2E-07
       Espacios en contraseña
       ======================================================== */

    test(
      'E2E-07 - La contraseña conserva los espacios introducidos',
      async ({ page }) => {

        await abrirInvitacion(page);

        const password = campoPassword(page);

        await password.fill(
          '  Inventario2026',
        );

        /*
         * Los espacios forman parte de la contraseña.
         */

        await expect(password).toHaveValue(
          '  Inventario2026',
        );
      },
    );


    /* ========================================================
       E2E-08
       Invitación válida
       ======================================================== */

    test(
      'E2E-08 - La invitación válida permite crear la cuenta',
      async ({ page }) => {

        await abrirInvitacion(page);

        await campoNombre(page).fill(
          'Ana Restrepo E2E',
        );

        await campoPassword(page).fill(
          'Inventario2026',
        );

        await page.getByRole('button', {
          name: /crear mi cuenta/i,
        }).click();

        /*
         * Esperamos a que la aplicación procese
         * la creación de la cuenta.
         */

        await page.waitForLoadState(
          'networkidle',
        ).catch(() => {});

        /*
         * Una invitación aceptada debe abandonar
         * la pantalla /invite/.
         */

        await expect(page).not.toHaveURL(
          /\/invite\//i,
        );
      },
    );

  },
);