import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * ============================================================
 * CONFIGURACIÓN DE LAS PRUEBAS END TO END
 * ============================================================
 *
 * Playwright abrirá un navegador real y ejecutará las pruebas
 * como si fuera un usuario.
 */

export default defineConfig({
  // Carpeta donde estarán las pruebas E2E
  testDir: './tests/e2e',

  // Si una prueba falla, podemos ver qué ocurrió.
  // Para comenzar dejamos false.
  fullyParallel: false,

  // Si una prueba falla, Playwright reintenta una vez.
  retries: 1,

  // Número de workers.
  // 1 facilita explicar y depurar las pruebas.
  workers: 1,

  // Reporte HTML.
  reporter: 'html',

  // URL base de Beverage Ledger.
  //
  // Podemos cambiarla mediante:
  //
  // BASE_URL=http://localhost:3000
  //
  // o usar la URL pública.
  use: {
    baseURL: process.env.BASE_URL ?? 'https://beverage-ledger-six.vercel.app',

    // Guarda evidencia cuando una prueba falla.
    screenshot: 'only-on-failure',

    // Guarda video cuando una prueba falla.
    video: 'retain-on-failure',

    // Traza para poder investigar errores.
    trace: 'retain-on-failure',

    // Navegador.
    headless: true,
  },

  projects: [
    {
      name: 'chromium',

      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
