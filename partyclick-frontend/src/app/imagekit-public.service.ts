import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ImageKitService {
  private backendUrl = 'http://localhost:3000/upload'; // Your backend URL

  constructor(private http: HttpClient) {}

  async uploadPhoto(photoDataUrl: string, fileName: string): Promise<string> {
    try {
      // Convert Data URL to base64 string (remove prefix)
      const base64 = photoDataUrl.split(',')[1];

      const response: any = await this.http.post(this.backendUrl, {
        file: base64,
        fileName
      }).toPromise();

      return response.url; // ImageKit URL
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  async uploadMultiplePhotos(photos: string[]): Promise<string[]> {
    const uploadPromises = photos.map((photo, index) => {
      if (photo) {
        const fileName = `guest-photo-${Date.now()}-${index}.jpg`;
        return this.uploadPhoto(photo, fileName);
      }
      return Promise.resolve('');
    });

    try {
      const urls = await Promise.all(uploadPromises);
      return urls.filter(url => url !== '');
    } catch (error) {
      console.error('Error uploading multiple photos:', error);
      throw error;
    }
  }
}
