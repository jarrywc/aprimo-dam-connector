import type { HttpClient } from './http.js';
import type { ApiResult, PagedResponse } from './types/common.js';

export async function* paginate<T>(
  http: HttpClient,
  initialPath: string,
  params?: Record<string, string | number | undefined>,
): AsyncGenerator<T[], void, unknown> {
  let path: string | undefined = initialPath;
  let queryParams = params;

  while (path) {
    const result: ApiResult<PagedResponse<T>> = await http.get<PagedResponse<T>>(path, { params: queryParams });
    if (!result.ok) {
      throw new Error(`Pagination request failed: ${result.error.message}`);
    }

    yield result.data.items;

    // Follow HAL next link if present
    const nextHref: string | undefined = result.data._links?.next?.href;
    if (nextHref) {
      path = nextHref;
      queryParams = undefined;
    } else {
      path = undefined;
    }
  }
}

export async function collectAll<T>(
  generator: AsyncGenerator<T[], void, unknown>,
  maxItems = 10000,
): Promise<T[]> {
  const items: T[] = [];
  for await (const page of generator) {
    items.push(...page);
    if (items.length >= maxItems) {
      items.length = maxItems;
      break;
    }
  }
  return items;
}
