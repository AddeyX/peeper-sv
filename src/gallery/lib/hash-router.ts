export interface HashState {
  relPath: string | null;
  props: Record<string, string | number | boolean>;
}

export function parseHash(hash: string): HashState {
  if (!hash || hash === "#") return { relPath: null, props: {} };
  const stripped = hash.replace(/^#/, "");
  const [pathPart, queryPart] = stripped.split("?");
  if (!pathPart) return { relPath: null, props: {} };
  const relPath = "src" + pathPart + ".svelte";
  const props: Record<string, string | number | boolean> = {};
  if (queryPart) {
    for (const [k, v] of new URLSearchParams(queryPart)) {
      props[k] = coerce(v);
    }
  }
  return { relPath, props };
}

export function encodeHash(
  relPath: string,
  props: Record<string, string | number | boolean>,
): string {
  const pathPart = relPath.replace(/^src/, "").replace(/\.svelte$/, "");
  const entries = Object.entries(props);
  if (entries.length === 0) return "#" + pathPart;
  const query = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
  return "#" + pathPart + "?" + query;
}

function coerce(v: string): string | number | boolean {
  if (v === "true") return true;
  if (v === "false") return false;
  const n = Number(v);
  if (!Number.isNaN(n) && v.trim() !== "") return n;
  return v;
}
