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

  async uploadMultiplePhotos(photos: string[], guestName: string = 'guest'): Promise<string[]> {
    const uploadPromises = photos.map((photo, index) => {
      if (photo) {
        // Clean guest name for filename (remove spaces and special characters)
        const cleanName = guestName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        
        // Create short date format (YYYYMMDD-HHMMSS)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const shortDate = `${year}${month}${day}-${hours}${minutes}${seconds}`;
        
        const fileName = `${cleanName}-${shortDate}.jpg`;
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
