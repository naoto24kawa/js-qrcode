import { QRCodeDecoder } from './decoder.js';
import { CameraAccessError } from './errors.js';

export class QRCodeScanner {
  constructor(options = {}) {
    this.video = options.video;
    this.canvas = options.canvas || this.createCanvas();
    this.continuous = options.continuous !== false;
    this.stream = null;
    this.scanning = false;
    this.decoder = new QRCodeDecoder();
    this.animationId = null;
    
    // EventTarget implementation
    this.listeners = new Map();
    
    this.isTestEnvironment = typeof navigator === 'undefined' || typeof document === 'undefined';
  }
  
  createCanvas() {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      return canvas;
    }
    return null;
  }
  
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(listener);
  }
  
  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      const listeners = this.listeners.get(type);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  dispatchEvent(event) {
    const type = event.type;
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(listener => {
        listener(event);
      });
    }
  }
  
  async start() {
    if (this.isTestEnvironment) {
      throw new CameraAccessError('Camera not available in test environment', 'FEATURE_NOT_AVAILABLE');
    }
    
    if (!navigator.mediaDevices) {
      throw new CameraAccessError('Camera not available in this environment', 'FEATURE_NOT_AVAILABLE');
    }
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        }
      });
      
      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
        
        if (this.canvas) {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
        }
      }
      
      this.scanning = true;
      
      if (this.continuous) {
        this.startContinuousScanning();
      }
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new CameraAccessError('Camera permission denied', 'CAMERA_PERMISSION_DENIED');
      } else if (error.name === 'NotFoundError') {
        throw new CameraAccessError('No camera found', 'CAMERA_NOT_FOUND');
      } else {
        throw new CameraAccessError('Failed to access camera', 'CAMERA_ACCESS_ERROR');
      }
    }
  }
  
  startContinuousScanning() {
    const scanFrame = async () => {
      if (!this.scanning) return;
      
      try {
        const result = await this.scan();
        if (result) {
          this.dispatchEvent({
            type: 'decode',
            detail: { data: result }
          });
        }
      } catch (error) {
        this.dispatchEvent({
          type: 'error',
          detail: { error }
        });
      }
      
      if (this.scanning) {
        this.animationId = requestAnimationFrame(scanFrame);
      }
    };
    
    this.animationId = requestAnimationFrame(scanFrame);
  }
  
  stop() {
    this.scanning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
    }
  }
  
  async scan() {
    if (!this.video || !this.canvas) {
      throw new Error('Video or canvas not available');
    }
    
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return await this.decoder.decode(imageData);
  }
  
  async scanImage(image) {
    if (!this.canvas) {
      throw new Error('Canvas not available');
    }
    
    const ctx = this.canvas.getContext('2d');
    
    if (image instanceof HTMLImageElement) {
      this.canvas.width = image.naturalWidth || image.width;
      this.canvas.height = image.naturalHeight || image.height;
      ctx.drawImage(image, 0, 0);
    } else if (image instanceof HTMLCanvasElement) {
      this.canvas.width = image.width;
      this.canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
    } else if (image instanceof ImageData) {
      this.canvas.width = image.width;
      this.canvas.height = image.height;
      ctx.putImageData(image, 0, 0);
    } else {
      throw new Error('Unsupported image type');
    }
    
    const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return await this.decoder.decode(imageData);
  }
}