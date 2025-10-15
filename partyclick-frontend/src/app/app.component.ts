import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageKitService } from './imagekit-public.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  uploadBoxes = Array(4).fill(0);
  capturedPhotos: string[] = Array(4).fill('');
  showCameraModal = false;
  showConfirmModal = false;
  showSuccessModal = false;
  currentBoxIndex = -1;
  videoElement: HTMLVideoElement | null = null;
  canvasElement: HTMLCanvasElement | null = null;
  stream: MediaStream | null = null;
  isUploading = false;
  uploadProgress = 0;

  constructor(private imagekitService: ImageKitService) {}

  async openCamera(boxIndex: number) {
    this.currentBoxIndex = boxIndex;
    this.showCameraModal = true;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Wait for the modal to be rendered
      setTimeout(() => {
        this.videoElement = document.getElementById('camera-video') as HTMLVideoElement;
        this.canvasElement = document.getElementById('camera-canvas') as HTMLCanvasElement;
        
        if (this.videoElement && this.stream) {
          this.videoElement.srcObject = this.stream;
          this.videoElement.play();
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
      this.closeCamera();
    }
  }

  capturePhoto() {
    if (this.videoElement && this.canvasElement && this.currentBoxIndex >= 0) {
      const context = this.canvasElement.getContext('2d');
      if (context) {
        // Set canvas size to match video
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        
        // Draw the current video frame to canvas
        context.drawImage(this.videoElement, 0, 0);
        
        // Convert canvas to data URL (base64 image)
        const photoDataUrl = this.canvasElement.toDataURL('image/jpeg', 0.8);
        
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
  }

  retakePhoto(boxIndex: number) {
    this.capturedPhotos[boxIndex] = '';
    this.openCamera(boxIndex);
  }

  openConfirmModal() {
    const hasPhotos = this.capturedPhotos.some(photo => photo !== '');
    if (hasPhotos) {
      this.showConfirmModal = true;
    } else {
      alert('Please take at least one photo before uploading.');
    }
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

      const downloadURLs = await this.imagekitService.uploadMultiplePhotos(photosToUpload);
      
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
  }

  get hasPhotos() {
    return this.capturedPhotos.some(photo => photo !== '');
  }

  get photoCount() {
    return this.capturedPhotos.filter(photo => photo !== '').length;
  }
}
