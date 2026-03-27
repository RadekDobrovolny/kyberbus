declare module "heic-convert" {
  type ConvertParams = {
    buffer: Buffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convert(params: ConvertParams): Promise<Buffer | Uint8Array>;
  export default convert;
}

declare module "heic-convert/index.js" {
  type ConvertParams = {
    buffer: Buffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convert(params: ConvertParams): Promise<Buffer | Uint8Array>;
  export default convert;
}
