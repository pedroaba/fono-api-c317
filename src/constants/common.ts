export const BASE_API_PREFIX = "/api"
export const API_VERSION = "/v1"

export const API_PREFIX = `${BASE_API_PREFIX}${API_VERSION}`

/**
 * Builds a prefix for the API.
 * @param prefix - The prefixes to build.
 * @returns The built prefix.
 */
export function prefixBuilder(...prefix: string[]): string {
  return `${API_PREFIX}/${prefix.map((p) => p.replace(/^\/+|\/+$/g, "")).join("/")}`
}
