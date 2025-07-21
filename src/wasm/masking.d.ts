declare module 'masking-wasm' {
  export interface QRMaskingWASM {
    applyMask(modules: boolean[][], maskPattern: number, size: number): boolean[][];
    evaluateMask(modules: boolean[][], size: number): number;
    findBestMask(modules: boolean[][], size: number): number;
    getPenaltyBreakdown(modules: boolean[][], size: number): number[];
    evaluateRule1(modules: boolean[][], size: number): number;
    evaluateRule2(modules: boolean[][], size: number): number;
    evaluateRule3(modules: boolean[][], size: number): number;
    evaluateRule4(modules: boolean[][], size: number): number;
  }

  export interface MaskingModule {
    QRMaskingWASM: {
      new(): QRMaskingWASM;
    };
  }

  export default function createModule(): Promise<MaskingModule>;
}
