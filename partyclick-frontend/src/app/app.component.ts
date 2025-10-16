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

  constructor(private imagekitService: ImageKitService) {}

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
      console.log('Available cameras:', this.availableCameras.length);
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
    
    // Try high-quality settings first
    let constraints: MediaStreamConstraints = { 
      video: { 
        deviceId: currentCamera ? { exact: currentCamera.deviceId } : undefined,
        facingMode: !currentCamera ? 'environment' : undefined, // Use back camera on mobile if no specific device
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 }
      } 
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (highQualityError) {
      console.warn('High quality settings failed, trying fallback:', highQualityError);
      // Fallback to lower quality if high quality fails
      constraints = { 
        video: { 
          deviceId: currentCamera ? { exact: currentCamera.deviceId } : undefined,
          facingMode: !currentCamera ? 'environment' : undefined,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    }
    
    // Wait for the modal to be rendered
    setTimeout(() => {
      this.videoElement = document.getElementById('camera-video') as HTMLVideoElement;
      this.canvasElement = document.getElementById('camera-canvas') as HTMLCanvasElement;
      
      if (this.videoElement && this.stream) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play();
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
        
        // Draw the current video frame to canvas
        context.drawImage(this.videoElement, 0, 0);
        
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

    try {
      const photosToUpload = this.capturedPhotos.filter(photo => photo !== '');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 200);

      const downloadURLs = await this.imagekitService.uploadMultiplePhotos(photosToUpload, this.guestName.trim());
      
      clearInterval(progressInterval);
      this.uploadProgress = 100;
      
      // Show success modal
      setTimeout(() => {
        this.isUploading = false;
        this.showSuccessModal = true;
        this.uploadProgress = 0;
      }, 500);

    } catch (error) {
      console.error('Upload failed:', error);
      this.isUploading = false;
      this.uploadProgress = 0;
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
