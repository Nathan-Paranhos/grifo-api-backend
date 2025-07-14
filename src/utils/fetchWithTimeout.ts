/**
 * Wrapper para fetch com timeout para evitar requisições que ficam travadas indefinidamente
 */

type FetchWithTimeoutOptions = RequestInit & {
  timeout?: number;
};

export class FetchTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchTimeoutError';
  }
}

/**
 * Executa uma requisição fetch com timeout
 * @param url URL da requisição
 * @param options Opções do fetch + timeout em ms
 * @returns Promise com a resposta do fetch
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const { signal } = controller;

  // Configura o timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError(`Requisição excedeu o timeout de ${timeout}ms`);
    }
    throw error;
  }
}