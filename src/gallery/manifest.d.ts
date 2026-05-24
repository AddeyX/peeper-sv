declare module "virtual:peeper-manifest" {
  import type { Manifest } from "peeper-sv";
  const m: Manifest;
  export default m;
}

declare module "virtual:peeper-global-css" {
  const _: unknown;
  export default _;
}
