/**
 * The public home of the service. Overridable with the PUBLIC_ORIGIN var so a
 * fork, a preview deploy or a self-hosted copy advertises its own address.
 */
export const DEFAULT_PUBLIC_ORIGIN = "https://signaas.cc";

/**
 * The canonical origin to advertise (canonical link, og:url, OpenAPI servers).
 *
 * Examples in the docs deliberately use the *request* origin instead, so that
 * a curl line copied from localhost or a preview deploy keeps working.
 */
export function canonicalOrigin(publicOrigin: string | undefined): string {
  const value = (publicOrigin ?? DEFAULT_PUBLIC_ORIGIN).trim();
  return value.replace(/\/+$/, "") || DEFAULT_PUBLIC_ORIGIN;
}

/** Where the corpus lives, and where a new tone or sign-off is a pull request away. */
export const REPOSITORY_URL = "https://github.com/wfinken/signaas";
