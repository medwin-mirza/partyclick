import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageKitService } from './imagekit-public.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  uploadBoxes = Array(4).fill(0);
  capturedPhotos: string[] = Array(4).fill('');
  guestName: string = '';
  showCameraModal = false;
  showConfirmModal = false;
  showSuccessModal = false;
  showToast = false;
  toastMessage = '';
  currentBoxIndex = -1;
  videoElement: HTMLVideoElement | null = null;
  canvasElement: HTMLCanvasElement | null = null;
  stream: MediaStream | null = null;
  isUploading = false;
  uploadProgress = 0;
  availableCameras: MediaDeviceInfo[] = [];
  currentCameraIndex = 0;
  isSwitchingCamera = false;
  isFrontCamera = false;
  
  // Fun loading screen properties
  jumpingText: string[] = [];
  floatingHearts: { delay: number; left: number }[] = [];
  sparkles: number[] = [];
  loadingMessages: string[] = [
    "Capturing the magic... ✨",
    "Creating memories... 💕",
    "Uploading love... 💖",
    "Almost there... 🎉",
    "Celebrating together... 🥳"
  ];
  currentMessageIndex = 0;
  currentLoadingMessage = "Preparing your photos...";

  constructor(private imagekitService: ImageKitService) {
    this.initializeFunLoading();
  }

  initializeFunLoading() {
    // Initialize jumping text
    this.jumpingText = "Adeline & Medwin".split('');
    
    // Initialize floating hearts
    this.floatingHearts = Array.from({ length: 8 }, (_, i) => ({
      delay: i * 0.5,
      left: Math.random() * 100
    }));
    
    // Initialize sparkles
    this.sparkles = Array.from({ length: 5 }, (_, i) => i);
  }

  onNameChange() {
    // Trim whitespace and update guest name
    this.guestName = this.guestName.trim();
  }

  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    
    // Auto-hide toast after 4 seconds
    setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  hideToast() {
    this.showToast = false;
  }

  async detectAvailableCameras() {
    try {
      // On some devices, we need permission first before labels are available
      // So we'll enumerate twice - once before (might have empty labels) and after permission
      let devices = await navigator.mediaDevices.enumerateDevices();
      let cameras = devices.filter(device => device.kind === 'videoinput');
      
      // If we have cameras but no labels, try to get permission first
      if (cameras.length > 0 && cameras.some(c => !c.label || c.label === '')) {
        try {
          // Request a temporary stream to get permission (will be stopped immediately)
          const tempStream = await this.getUserMedia({ video: true });
          tempStream.getTracks().forEach(track => track.stop());
          
          // Now enumerate again - labels should be available
          devices = await navigator.mediaDevices.enumerateDevices();
          cameras = devices.filter(device => device.kind === 'videoinput');
        } catch (permError) {
          // Permission denied or other error - continue with what we have
          console.warn('Could not get camera permission for device enumeration:', permError);
        }
      }
      
      this.availableCameras = cameras;
      
      // Sort cameras: back camera first, then front camera
      this.availableCameras.sort((a, b) => {
        const aLabel = (a.label || '').toLowerCase();
        const bLabel = (b.label || '').toLowerCase();
        const aIsFront = aLabel.includes('front') || 
                        aLabel.includes('user') ||
                        aLabel.includes('selfie') ||
                        aLabel.includes('facing');
        const bIsFront = bLabel.includes('front') || 
                        bLabel.includes('user') ||
                        bLabel.includes('selfie') ||
                        bLabel.includes('facing');
        return aIsFront ? 1 : bIsFront ? -1 : 0;
      });
      
      console.log('Available cameras:', this.availableCameras.length);
      console.log('Camera labels:', this.availableCameras.map(c => c.label || 'Unnamed'));
    } catch (error) {
      console.error('Error detecting cameras:', error);
      this.availableCameras = [];
    }
  }

  get hasMultipleCameras(): boolean {
    return this.availableCameras.length > 1;
  }

  /**
   * Check if the browser supports camera access
   */
  isCameraSupported(): boolean {
    // Check for getUserMedia support
    const hasGetUserMedia = !!(
      navigator.mediaDevices?.getUserMedia ||
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
    );
    
    if (!hasGetUserMedia) {
      return false;
    }
    
    // Check if we're on HTTPS or localhost (required for getUserMedia)
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           location.hostname === 'localhost' || 
                           location.hostname === '127.0.0.1';
    
    return isSecureContext;
  }

  /**
   * Get user-friendly browser compatibility message
   */
  getBrowserCompatibilityMessage(): string {
    const hasGetUserMedia = !!(
      navigator.mediaDevices?.getUserMedia ||
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
    );
    
    if (!hasGetUserMedia) {
      return 'Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, Safari, or Edge.';
    }
    
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           location.hostname === 'localhost' || 
                           location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      return 'Camera access requires a secure connection (HTTPS). Please access this app over HTTPS.';
    }
    
    return '';
  }

  /**
   * Get getUserMedia with legacy browser support
   */
  private async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    // Modern API (preferred)
    if (navigator.mediaDevices?.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(constraints);
    }
    
    // Legacy APIs (for older browsers)
    const legacyGetUserMedia = 
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;
    
    if (legacyGetUserMedia) {
      return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(
          navigator,
          constraints,
          resolve,
          reject
        );
      });
    }
    
    throw new Error('getUserMedia is not supported in this browser');
  }

  async openCamera(boxIndex: number) {
    this.currentBoxIndex = boxIndex;
    this.showCameraModal = true;
    
    // Check browser compatibility first
    if (!this.isCameraSupported()) {
      const compatibilityMessage = this.getBrowserCompatibilityMessage();
      this.showToastMessage(compatibilityMessage);
      this.closeCamera();
      return;
    }
    
    // Detect available cameras first
    await this.detectAvailableCameras();
    
    try {
      await this.startCamera();
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      // Use the enhanced error message if available, otherwise fallback
      const errorMessage = error?.message || 'Unable to access camera. Please check permissions.';
      this.showToastMessage(errorMessage);
      this.closeCamera();
    }
  }

  async startCamera() {
    // Stop existing stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    const currentCamera = this.availableCameras[this.currentCameraIndex];
    
    // Detect if current camera is front camera (more robust detection)
    this.isFrontCamera = false;
    if (currentCamera) {
      const label = currentCamera.label.toLowerCase();
      const isFront = label.includes('front') || 
                     label.includes('user') ||
                     label.includes('selfie') ||
                     label.includes('facing');
      const isBack = label.includes('back') || 
                    label.includes('rear') ||
                    label.includes('environment') ||
                    label.includes('world');
      
      // Only flip if it's clearly a front camera and not a back camera
      this.isFrontCamera = isFront && !isBack;
      
      console.log(`Camera: ${currentCamera.label}`);
      console.log(`Is Front: ${isFront}, Is Back: ${isBack}, Will Flip: ${this.isFrontCamera}`);
    }
    
    // Build progressive constraint attempts with multiple strategies
    const constraintAttempts: any[] = [];
    
    // Strategy 1: Try with deviceId (if available) with quality constraints
    if (currentCamera && currentCamera.deviceId) {
      constraintAttempts.push(
        { deviceId: { ideal: currentCamera.deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        { deviceId: { ideal: currentCamera.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
        { deviceId: { ideal: currentCamera.deviceId }, width: { ideal: 640 }, height: { ideal: 480 } },
        { deviceId: { ideal: currentCamera.deviceId } }
      );
    }
    
    // Strategy 2: Try with facingMode (for mobile devices)
    constraintAttempts.push(
      { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      { facingMode: { ideal: 'environment' } },
      { facingMode: 'environment' }
    );
    
    // Strategy 3: Try with user-facing camera (front camera)
    constraintAttempts.push(
      { facingMode: { ideal: 'user' } },
      { facingMode: 'user' }
    );
    
    // Strategy 4: Most basic - just request video (most compatible)
    constraintAttempts.push(true);

    let lastError: any = null;
    
    for (const videoConstraints of constraintAttempts) {
      try {
        this.stream = await this.getUserMedia({ 
          video: videoConstraints 
        });
        console.log('Camera started successfully with constraints:', videoConstraints);
        
        // If we used a basic fallback, try to detect which camera we got
        if (videoConstraints === true && this.stream) {
          const tracks = this.stream.getVideoTracks();
          if (tracks.length > 0) {
            const settings = tracks[0].getSettings();
            // Update currentCameraIndex if we can identify the camera
            if (settings.deviceId) {
              const foundIndex = this.availableCameras.findIndex(c => c.deviceId === settings.deviceId);
              if (foundIndex >= 0) {
                this.currentCameraIndex = foundIndex;
                const detectedCamera = this.availableCameras[foundIndex];
                const label = detectedCamera.label.toLowerCase();
                this.isFrontCamera = (label.includes('front') || 
                                     label.includes('user') ||
                                     label.includes('selfie')) &&
                                    !(label.includes('back') || label.includes('rear'));
              }
            }
          }
        }
        
        break; // Success! Exit the loop
      } catch (error: any) {
        lastError = error;
        console.warn('Constraint attempt failed:', videoConstraints, error.name, error.message);
        // Continue to next attempt
      }
    }
    
    // If all attempts failed, throw the last error with better context
    if (!this.stream) {
      const errorMessage = lastError?.name === 'NotAllowedError' 
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : lastError?.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError'
        ? 'Camera is already in use by another application.'
        : lastError?.name === 'OverconstrainedError'
        ? 'Camera does not support the required settings. Please try a different device.'
        : 'Unable to access camera. Please check your browser permissions and try again.';
      
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = lastError;
      throw enhancedError;
    }
    
    // Wait for the modal to be rendered
    setTimeout(() => {
      this.videoElement = document.getElementById('camera-video') as HTMLVideoElement;
      this.canvasElement = document.getElementById('camera-canvas') as HTMLCanvasElement;
      
      if (this.videoElement && this.stream) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play();
        
        // Apply mirroring for front camera
        if (this.isFrontCamera) {
          this.videoElement.style.transform = 'scaleX(-1)';
        } else {
          this.videoElement.style.transform = 'scaleX(1)';
        }
      }
    }, 100);
  }

  async toggleCamera() {
    if (this.availableCameras.length <= 1) return;
    
    this.isSwitchingCamera = true;
    
    // Switch to next camera
    this.currentCameraIndex = (this.currentCameraIndex + 1) % this.availableCameras.length;
    
    try {
      await this.startCamera();
    } catch (error) {
      console.error('Error switching camera:', error);
      // Revert to previous camera if switching fails
      this.currentCameraIndex = (this.currentCameraIndex - 1 + this.availableCameras.length) % this.availableCameras.length;
      await this.startCamera();
    } finally {
      this.isSwitchingCamera = false;
    }
  }

  capturePhoto() {
    if (this.videoElement && this.canvasElement && this.currentBoxIndex >= 0) {
      const context = this.canvasElement.getContext('2d');
      if (context) {
        // Set canvas size to match video dimensions for maximum quality
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        
        // Enable high-quality image rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Handle front camera mirroring for captured photo
        if (this.isFrontCamera) {
          // Save current transform
          context.save();
          // Flip horizontally for front camera
          context.scale(-1, 1);
          context.translate(-this.canvasElement.width, 0);
          // Draw the current video frame to canvas
          context.drawImage(this.videoElement, 0, 0);
          // Restore transform
          context.restore();
        } else {
          // Draw the current video frame to canvas normally for back camera
          context.drawImage(this.videoElement, 0, 0);
        }
        
        // Convert canvas to data URL with maximum quality
        const photoDataUrl = this.canvasElement.toDataURL('image/jpeg', 0.95);
        
        // Store the photo
        this.capturedPhotos[this.currentBoxIndex] = photoDataUrl;
        
        // Close camera
        this.closeCamera();
      }
    }
  }

  closeCamera() {
    this.showCameraModal = false;
    this.currentBoxIndex = -1;
    this.isSwitchingCamera = false;
    this.isFrontCamera = false;
    
    // Stop the camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    // Reset camera state
    this.currentCameraIndex = 0;
  }

  retakePhoto(boxIndex: number) {
    this.capturedPhotos[boxIndex] = '';
    this.openCamera(boxIndex);
  }

  openConfirmModal() {
    const hasPhotos = this.capturedPhotos.some(photo => photo !== '');
    const hasName = this.guestName.trim().length > 0;
    
    if (!hasName && !hasPhotos) {
      this.showToastMessage('Please enter your name and take at least 1 photo to upload');
      return;
    }
    
    if (!hasName) {
      this.showToastMessage('Please enter your name to upload photos');
      return;
    }
    
    if (!hasPhotos) {
      this.showToastMessage('Please take at least 1 photo to upload');
      return;
    }
    
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
  }

  async confirmUpload() {
    this.showConfirmModal = false;
    this.isUploading = true;
    this.uploadProgress = 0;
    this.currentMessageIndex = 0;
    this.currentLoadingMessage = "Preparing your photos...";

    try {
      const photosToUpload = this.capturedPhotos.filter(photo => photo !== '');
      
      // Start loading message rotation
      const messageInterval = setInterval(() => {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
        this.currentLoadingMessage = this.loadingMessages[this.currentMessageIndex];
      }, 1500);
      
      // Simulate progress updates with fun messages
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 300);

      const downloadURLs = await this.imagekitService.uploadMultiplePhotos(photosToUpload, this.guestName.trim());
      
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      this.uploadProgress = 100;
      this.currentLoadingMessage = "Upload complete! 🎉";
      
      // Show success modal
      setTimeout(() => {
        this.isUploading = false;
        this.showSuccessModal = true;
        this.uploadProgress = 0;
        this.currentMessageIndex = 0;
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      this.isUploading = false;
      this.uploadProgress = 0;
      this.currentMessageIndex = 0;
      alert('Upload failed. Please try again.');
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    // Reset photos after successful upload
    this.capturedPhotos = Array(4).fill('');
    // Clear the guest name
    this.guestName = '';
  }

  get hasPhotos() {
    return this.capturedPhotos.some(photo => photo !== '');
  }

  get hasName() {
    return this.guestName.trim().length > 0;
  }

  get photoCount() {
    return this.capturedPhotos.filter(photo => photo !== '').length;
  }
}
