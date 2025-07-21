/**
 * Camera Manager for QR Code Scanner
 * Handles camera access, stream management, and device enumeration
 */

import { ErrorFactory, CameraAccessError, EnvironmentError } from './errors.js';

export class CameraManager extends EventTarget {
  constructor(options = {}) {
    super();
    
    this.options = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'environment'
      },
      audio: false,
      ...options
    };
    
    this.stream = null;
    this.isActive = false;
    this.devices = [];
    
    // Check environment compatibility
    this.checkEnvironmentSupport();
  }

  /**
   * Check if the current environment supports camera access
   */
  checkEnvironmentSupport() {
    // Test environment detection
    if (typeof navigator === 'undefined' || typeof document === 'undefined') {
      throw ErrorFactory.createEnvironmentError(
        EnvironmentError.CODES.FEATURE_NOT_AVAILABLE,
        'Camera not available in test environment',
        { environment: 'test' }
      );
    }

    // Browser support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw ErrorFactory.createEnvironmentError(
        EnvironmentError.CODES.UNSUPPORTED_BROWSER,
        'Camera not available in this environment',
        { 
          hasNavigator: typeof navigator !== 'undefined',
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia
        }
      );
    }

    // HTTPS requirement check (except localhost)
    if (location.protocol !== 'https:' && 
        !location.hostname.includes('localhost') && 
        location.hostname !== '127.0.0.1') {
      throw ErrorFactory.createEnvironmentError(
        EnvironmentError.CODES.SECURITY_RESTRICTION,
        'Camera access requires HTTPS',
        { protocol: location.protocol, hostname: location.hostname }
      );
    }
  }

  /**
   * Start camera stream
   */
  async startCamera(deviceId = null) {
    try {
      // Update constraints if specific device requested
      const constraints = { ...this.options };
      if (deviceId) {
        constraints.video = {
          ...constraints.video,
          deviceId: { exact: deviceId }
        };
      }

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isActive = true;

      // Dispatch success event
      this.dispatchEvent(new CustomEvent('camera-started', {
        detail: { 
          stream: this.stream,
          constraints: constraints,
          deviceId: deviceId
        }
      }));

      return this.stream;

    } catch (error) {
      const cameraError = this.handleCameraError(error);
      
      // Dispatch error event
      this.dispatchEvent(new CustomEvent('camera-error', {
        detail: { error: cameraError }
      }));
      
      throw cameraError;
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      
      this.stream = null;
      this.isActive = false;

      // Dispatch stop event
      this.dispatchEvent(new CustomEvent('camera-stopped', {
        detail: { timestamp: Date.now() }
      }));
    }
  }

  /**
   * Switch to different camera device
   */
  async switchDevice(deviceId) {
    const wasActive = this.isActive;
    
    if (wasActive) {
      this.stopCamera();
    }
    
    if (wasActive || deviceId) {
      return await this.startCamera(deviceId);
    }
    
    return null;
  }

  /**
   * Get available camera devices
   */
  async getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      
      return this.devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${this.devices.indexOf(device) + 1}`,
        groupId: device.groupId
      }));
      
    } catch (error) {
      throw ErrorFactory.createCameraError(
        CameraAccessError.CODES.DEVICE_NOT_FOUND,
        'Failed to enumerate camera devices',
        { originalError: error }
      );
    }
  }

  /**
   * Get current stream settings
   */
  getStreamSettings() {
    if (!this.stream) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      return null;
    }

    const settings = videoTrack.getSettings();
    const capabilities = videoTrack.getCapabilities();
    
    return {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
      facingMode: settings.facingMode,
      deviceId: settings.deviceId,
      capabilities: capabilities
    };
  }

  /**
   * Apply constraints to current stream
   */
  async applyConstraints(constraints) {
    if (!this.stream) {
      throw ErrorFactory.createCameraError(
        CameraAccessError.CODES.STREAM_ERROR,
        'No active camera stream to apply constraints to'
      );
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw ErrorFactory.createCameraError(
        CameraAccessError.CODES.STREAM_ERROR,
        'No video track in current stream'
      );
    }

    try {
      await videoTrack.applyConstraints(constraints);
      
      // Dispatch constraints changed event
      this.dispatchEvent(new CustomEvent('constraints-changed', {
        detail: { 
          constraints: constraints,
          settings: videoTrack.getSettings()
        }
      }));
      
    } catch (error) {
      throw ErrorFactory.createCameraError(
        CameraAccessError.CODES.HARDWARE_ERROR,
        'Failed to apply camera constraints',
        { originalError: error, constraints: constraints }
      );
    }
  }

  /**
   * Handle camera access errors and convert to standardized errors
   */
  handleCameraError(error) {
    // Map native browser errors to our error system
    const errorMappings = {
      'NotAllowedError': {
        code: CameraAccessError.CODES.PERMISSION_DENIED,
        message: 'Camera access permission was denied'
      },
      'NotFoundError': {
        code: CameraAccessError.CODES.DEVICE_NOT_FOUND,
        message: 'No camera device found'
      },
      'NotSupportedError': {
        code: CameraAccessError.CODES.NOT_SUPPORTED,
        message: 'Camera access not supported'
      },
      'NotReadableError': {
        code: CameraAccessError.CODES.HARDWARE_ERROR,
        message: 'Camera device is already in use or hardware error'
      },
      'OverconstrainedError': {
        code: CameraAccessError.CODES.HARDWARE_ERROR,
        message: 'Camera constraints cannot be satisfied'
      },
      'SecurityError': {
        code: CameraAccessError.CODES.PERMISSION_DENIED,
        message: 'Camera access blocked by security policy'
      }
    };

    const mapping = errorMappings[error.name] || {
      code: CameraAccessError.CODES.HARDWARE_ERROR,
      message: 'Unknown camera error'
    };

    return ErrorFactory.createCameraError(
      mapping.code,
      mapping.message,
      { 
        originalError: error,
        browserErrorName: error.name,
        browserErrorMessage: error.message
      }
    );
  }

  /**
   * Check if camera is currently active
   */
  get isCameraActive() {
    return this.isActive && this.stream && 
           this.stream.getVideoTracks().some(track => track.readyState === 'live');
  }

  /**
   * Get current camera status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      isCameraActive: this.isCameraActive,
      hasStream: !!this.stream,
      deviceCount: this.devices.length,
      currentSettings: this.getStreamSettings(),
      supportedConstraints: navigator.mediaDevices?.getSupportedConstraints?.() || {}
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopCamera();
    this.devices = [];
    
    // Remove all event listeners
    this.removeEventListener('camera-started', this.handleCameraStarted);
    this.removeEventListener('camera-stopped', this.handleCameraStopped);
    this.removeEventListener('camera-error', this.handleCameraError);
    this.removeEventListener('constraints-changed', this.handleConstraintsChanged);
  }
}