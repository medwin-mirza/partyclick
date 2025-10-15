# Partyclick

A mobile-friendly Angular application for uploading party photos.

## Features

- Responsive design optimized for mobile devices
- Clean, modern UI with gradient background
- 4 upload boxes with camera integration for photo capture
- Touch-friendly interface
- ImageKit.io integration for photo storage and management
- Real-time photo upload with progress tracking

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:4200`

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Development

This project was generated with Angular CLI version 17.0.0.

## ImageKit.io Setup

This app uses a backend server to handle ImageKit uploads securely.

### Backend Setup:
1. **Create ImageKit Account**: Sign up at [imagekit.io](https://imagekit.io)
2. **Get Credentials**: Get your URL endpoint, public key, and private key from ImageKit dashboard
3. **Backend Server**: The app expects a backend server running on `http://localhost:3000`
4. **Backend Route**: Your backend should have a POST route at `/upload` that handles ImageKit uploads

### Backend Implementation Example:
```javascript
// Your backend should have this route
app.post("/upload", async (req, res) => {
  try {
    const { file, fileName } = req.body; // file = base64 string from frontend

    const result = await imagekit.upload({
      file,
      fileName,
      folder: "/party-photos",
      useUniqueFileName: true,
      tags: ["party", "guest-upload"],
    });

    res.json({ url: result.url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});
```

### Frontend Configuration:
- The frontend sends base64 image data to your backend
- Backend handles ImageKit authentication and upload
- Returns the ImageKit URL to the frontend

## Mobile Optimization

The application is specifically designed for mobile devices with:
- Responsive grid layout
- Touch-friendly interface elements
- Optimized font sizes and spacing
- Gradient background for visual appeal
- Backdrop blur effects for modern look
- Camera integration for direct photo capture
- ImageKit.io for optimized image delivery
