import { QRModeDetector } from './mode-detector.js';
import { QRVersionSelector } from './version-selector.js';
import { QRDataEncoderCore } from './data-encoder-core.js';
import { QRDataPadder } from './data-padder.js';

export class QRDataEncoder {
  constructor() {
    this.modeDetector = new QRModeDetector();
    this.versionSelector = new QRVersionSelector();
    this.encoderCore = new QRDataEncoderCore();
    this.dataPadder = new QRDataPadder();
  }

  detectMode(data) {
    return this.modeDetector.detectMode(data);
  }

  determineVersion(data, mode, errorCorrectionLevel) {
    return this.versionSelector.determineVersion(data, mode, errorCorrectionLevel);
  }

  encode(data, mode, version) {
    return this.encoderCore.encode(data, mode, version);
  }

  encodeToBytes(data, mode, version, errorCorrectionLevel) {
    const bits = this.encode(data, mode, version);
    return this.dataPadder.addPadding(bits, version, errorCorrectionLevel);
  }

  encodeNumeric(data) {
    return this.encoderCore.encodeNumeric(data);
  }

  encodeAlphanumeric(data) {
    return this.encoderCore.encodeAlphanumeric(data);
  }

  encodeByte(data) {
    return this.encoderCore.encodeByte(data);
  }
}