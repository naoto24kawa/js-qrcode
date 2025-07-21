declare module 'reed-solomon-wasm' {
  export interface QRErrorCorrection {
    addErrorCorrection(dataBytes: number[], version: number, errorCorrectionLevel: string): number[];
  }

  export interface ReedSolomonModule {
    QRErrorCorrection: {
      new(): QRErrorCorrection;
    };
  }

  export default function createModule(): Promise<ReedSolomonModule>;
}
