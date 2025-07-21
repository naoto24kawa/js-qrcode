declare module 'data-encoder-wasm' {
  export interface QRDataEncoderWASM {
    detectMode(data: string): number;
    determineVersion(data: string, mode: number, errorCorrectionLevel: string): number;
    encode(data: string, mode: number, version: number): string;
    encodeToBytes(data: string, mode: number, version: number, errorCorrectionLevel: string): number[];
    getModeIndex(mode: number): number;
    isAlphanumeric(data: string): boolean;
    getUtf8Bytes(data: string): number[];
  }

  export interface DataEncoderModule {
    QRDataEncoderWASM: {
      new(): QRDataEncoderWASM;
    };
    QR_MODE_NUMERIC: number;
    QR_MODE_ALPHANUMERIC: number;
    QR_MODE_BYTE: number;
  }

  export default function createModule(): Promise<DataEncoderModule>;
}
