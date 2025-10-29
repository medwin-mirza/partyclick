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
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableCameras = devices.filter(device => device.kind === 'videoinput');
      
      // Sort cameras: back camera first, then front camera
      this.availableCameras.sort((a, b) => {
        const aIsFront = a.label.toLowerCase().includes('front') || 
                        a.label.toLowerCase().includes('user') ||
                        a.label.toLowerCase().includes('selfie') ||
                        a.label.toLowerCase().includes('facing');
        const bIsFront = b.label.toLowerCase().includes('front') || 
                        b.label.toLowerCase().includes('user') ||
                        b.label.toLowerCase().includes('selfie') ||
                        b.label.toLowerCase().includes('facing');
        return aIsFront ? 1 : bIsFront ? -1 : 0;
      });
      
      console.log('Available cameras:', this.availableCameras.length);
      console.log('Camera labels:', this.availableCameras.map(c => c.label));
    } catch (error) {
      console.error('Error detecting cameras:', error);
      this.availableCameras = [];
    }
  }

  get hasMultipleCameras(): boolean {
    return this.availableCameras.length > 1;
  }

  async openCamera(boxIndex: number) {
    this.currentBoxIndex = boxIndex;
    this.showCameraModal = true;
    
    // Detect available cameras first
    await this.detectAvailableCameras();
    
    try {
      await this.startCamera();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
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
    
    // Build base video constraints without conflicting properties
    const baseVideoConstraints: any = {};
    
    // Only set deviceId if we have a camera selected
    if (currentCamera && currentCamera.deviceId) {
      // Use 'ideal' instead of 'exact' to avoid OverconstrainedError
      baseVideoConstraints.deviceId = { ideal: currentCamera.deviceId };
    } else {
      // Fallback to facingMode if no device selected
      baseVideoConstraints.facingMode = { ideal: 'environment' };
    }
    
    // Progressive constraint attempts - from highest to lowest quality
    const constraintAttempts = [
      // High quality
      { 
        ...baseVideoConstraints,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      // Medium-high quality
      { 
        ...baseVideoConstraints,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      // Medium quality
      { 
        ...baseVideoConstraints,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      // Low quality - basic constraints only
      { 
        ...baseVideoConstraints
      }
    ];

    let lastError: any = null;
    
    for (const videoConstraints of constraintAttempts) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: videoConstraints 
        });
        console.log('Camera started successfully with constraints:', videoConstraints);
        break; // Success! Exit the loop
      } catch (error: any) {
        lastError = error;
        console.warn('Constraint attempt failed:', videoConstraints, error);
        // Continue to next attempt
      }
    }
    
    // If all attempts failed, throw the last error
    if (!this.stream) {
      throw lastError || new Error('Failed to access camera');
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
