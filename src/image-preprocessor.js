/**
 * Image Preprocessor for QR Code Detection
 * Handles various image formats and prepares binary matrix for analysis
 */

import { adaptiveThreshold } from './image-utils.js';
import { uint8ArrayToImageData, parseImageFromBase64, parseImageFromBuffer } from './image-utils.js';
import { ErrorFactory, QRCodeDecodeError } from './errors.js';

export class ImagePreprocessor {
  constructor(options = {}) {
    this.options = {
      adaptiveThreshold: true,
      blockSize: 11,
      thresholdConstant: 2,
      ...options
    };
  }

  /**
   * Preprocess image data into binary matrix
   * Supports ImageData, Uint8Array, and Base64 formats
   */
  async preprocessImage(data, width = null, height = null) {
    try {
      let imageData;

      // Handle different input formats
      if (data instanceof ImageData) {
        imageData = data;
      } else if (data instanceof Uint8Array) {
        imageData = this.processUint8Array(data, width, height);
      } else if (typeof data === 'string') {
        imageData = await this.processBase64String(data);
      } else {
        throw ErrorFactory.createDecodeError(
          QRCodeDecodeError.CODES.INVALID_IMAGE,
          'Unsupported image data format',
          { format: typeof data, hasWidth: width !== null, hasHeight: height !== null }
        );
      }

      // Validate image data
      this.validateImageData(imageData);

      // Convert to binary matrix
      return this.createBinaryMatrix(imageData);

    } catch (error) {
      if (error instanceof QRCodeDecodeError) {
        throw error;
      }
      
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.PREPROCESSING_FAILED,
        `Image preprocessing failed: ${error.message}`,
        { originalError: error, dataType: typeof data }
      );
    }
  }

  /**
   * Process Uint8Array with width/height
   */
  processUint8Array(data, width, height) {
    if (!width || !height) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.INVALID_IMAGE,
        'Width and height required for Uint8Array data',
        { dataLength: data.length, hasWidth: !!width, hasHeight: !!height }
      );
    }

    // Check if data length matches expected size
    const expectedLength = width * height * 4; // RGBA
    const expectedGrayscale = width * height; // Grayscale
    
    if (data.length === expectedLength) {
      // RGBA format
      return uint8ArrayToImageData(data, width, height);
    } else if (data.length === expectedGrayscale) {
      // Grayscale format - convert to RGBA
      return this.grayscaleToImageData(data, width, height);
    } else {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.INVALID_IMAGE,
        'Uint8Array length does not match dimensions',
        { 
          dataLength: data.length, 
          expectedRGBA: expectedLength,
          expectedGrayscale: expectedGrayscale,
          width, 
          height 
        }
      );
    }
  }

  /**
   * Convert grayscale array to ImageData
   */
  grayscaleToImageData(grayscaleArray, width, height) {
    const imageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < grayscaleArray.length; i++) {
      const pixelIndex = i * 4;
      const gray = grayscaleArray[i];
      imageData[pixelIndex] = gray;     // R
      imageData[pixelIndex + 1] = gray; // G
      imageData[pixelIndex + 2] = gray; // B
      imageData[pixelIndex + 3] = 255;  // A
    }
    return new ImageData(imageData, width, height);
  }

  /**
   * Process Base64 string
   */
  async processBase64String(base64Data) {
    try {
      // Handle data URLs
      if (base64Data.startsWith('data:')) {
        return await parseImageFromBase64(base64Data);
      }
      
      // Handle raw base64
      const dataUrl = `data:image/png;base64,${base64Data}`;
      return await parseImageFromBase64(dataUrl);
    } catch (error) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.INVALID_IMAGE,
        'Failed to parse Base64 image data',
        { originalError: error, isDataUrl: base64Data.startsWith('data:') }
      );
    }
  }

  /**
   * Validate ImageData object
   */
  validateImageData(imageData) {
    if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.INVALID_IMAGE,
        'Invalid ImageData object',
        { 
          hasData: !!imageData?.data,
          width: imageData?.width,
          height: imageData?.height
        }
      );
    }

    if (imageData.width < 21 || imageData.height < 21) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.INVALID_IMAGE,
        'Image too small for QR code detection (minimum 21x21)',
        { width: imageData.width, height: imageData.height }
      );
    }

    const expectedDataLength = imageData.width * imageData.height * 4;
    if (imageData.data.length !== expectedDataLength) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.INVALID_IMAGE,
        'ImageData size mismatch',
        { 
          actualLength: imageData.data.length,
          expectedLength: expectedDataLength,
          width: imageData.width,
          height: imageData.height
        }
      );
    }
  }

  /**
   * Create binary matrix from ImageData
   */
  createBinaryMatrix(imageData) {
    try {
      if (this.options.adaptiveThreshold) {
        return adaptiveThreshold(
          imageData, 
          this.options.blockSize, 
          this.options.thresholdConstant
        );
      } else {
        // Simple threshold fallback
        return this.simpleThreshold(imageData);
      }
    } catch (error) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.PREPROCESSING_FAILED,
        'Binary matrix creation failed',
        { 
          originalError: error,
          adaptiveThreshold: this.options.adaptiveThreshold,
          imageSize: `${imageData.width}x${imageData.height}`
        }
      );
    }
  }

  /**
   * Simple threshold for fallback
   */
  simpleThreshold(imageData, threshold = 128) {
    const { data, width, height } = imageData;
    const binary = Array(height).fill().map(() => Array(width).fill(0));
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        binary[y][x] = gray < threshold ? 1 : 0;
      }
    }
    
    return binary;
  }

  /**
   * Get preprocessing statistics for debugging
   */
  getStatistics(imageData, binaryMatrix) {
    const totalPixels = imageData.width * imageData.height;
    let darkPixels = 0;
    
    for (let y = 0; y < binaryMatrix.length; y++) {
      for (let x = 0; x < binaryMatrix[y].length; x++) {
        if (binaryMatrix[y][x]) darkPixels++;
      }
    }
    
    return {
      width: imageData.width,
      height: imageData.height,
      totalPixels,
      darkPixels,
      lightPixels: totalPixels - darkPixels,
      darkRatio: darkPixels / totalPixels,
      processingOptions: this.options
    };
  }
}