class QRCodeError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class QRCodeGenerationError extends QRCodeError {}
export class QRCodeDecodeError extends QRCodeError {}
export class CameraAccessError extends QRCodeError {}
export class EnvironmentError extends QRCodeError {}