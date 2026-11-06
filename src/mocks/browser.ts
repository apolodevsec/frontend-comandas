import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Service worker do mock, usado somente no navegador. Para acoplar ao backend
 * real, pare de chamar iniciarMock() em main.tsx (docs/adr/0001).
 */
export const workerDeMock = setupWorker(...handlers);

export async function iniciarMock(): Promise<void> {
  await workerDeMock.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}
