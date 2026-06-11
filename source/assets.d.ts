// Vite resolves these asset imports to a URL string at build time.
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.scss" {
  const css: string;
  export default css;
}
