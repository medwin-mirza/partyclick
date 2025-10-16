# Partyclick - Photo Upload App

A mobile-friendly Angular frontend with Node.js backend for uploading party photos to ImageKit.io.

## 🎯 Features

- **Mobile-Optimized**: Responsive design for mobile devices
- **Camera Integration**: Direct photo capture using device camera
- **Guest Names**: Required name input for photo organization
- **ImageKit Storage**: Professional image hosting and optimization
- **Real-time Upload**: Progress tracking and success confirmation

## 📁 Project Structure

```
partyclick/
├── partyclick-frontend/     # Angular application
├── partyclick-backend/      # Node.js server
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **ImageKit.io account** (for photo storage)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd partyclick

# Install frontend dependencies
cd partyclick-frontend
npm install

# Install backend dependencies
cd ../partyclick-backend
npm install
```

### 2. ImageKit Configuration

1. **Create ImageKit Account**: Sign up at [imagekit.io](https://imagekit.io)
2. **Get Credentials**: From ImageKit Dashboard → Settings → API Keys
3. **Update Backend**: Add your ImageKit credentials to the backend
4. **Enable Uploads**: Enable uploads in your ImageKit project settings

### 3. Start Applications

#### Start Backend Server
```bash
cd partyclick-backend
npm start
# Server runs on http://localhost:3000
```

#### Start Frontend (in a new terminal)
```bash
cd partyclick-frontend
npm start
# App runs on http://localhost:4200
```

### 4. Access the App

Open your browser and navigate to `http://localhost:4200`

## 🔧 Development

### Frontend (Angular)

```bash
cd partyclick-frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

**Key Files:**
- `src/app/app.component.ts` - Main component
- `src/app/imagekit-public.service.ts` - Upload service
- `src/app/app.component.html` - UI template
- `src/app/app.component.scss` - Styles

### Backend (Node.js)

```bash
cd partyclick-backend

# Start server
npm start

# Development mode (if nodemon is installed)
npm run dev
```

**Key Files:**
- `partyclick-backend.js` - Main server file
- `package.json` - Dependencies and scripts

## 📱 How to Use

1. **Enter Name**: Type your name in the input field
2. **Take Photos**: Click on upload boxes to open camera
3. **Capture**: Use the camera to take up to 4 photos
4. **Upload**: Click "Upload" button to send photos
5. **Confirm**: Confirm upload in the modal dialog
6. **Success**: Photos are uploaded to ImageKit with your name

## 🛠️ Configuration

### Frontend Configuration

The frontend connects to the backend at `http://localhost:3000/upload`. Update the URL in:
```typescript
// partyclick-frontend/src/app/imagekit-public.service.ts
private backendUrl = 'http://localhost:3000/upload';
```

### Backend Configuration

Update your ImageKit credentials in the backend:
```javascript
// partyclick-backend/partyclick-backend.js
const imagekit = new ImageKit({
    publicKey: "your-public-key",
    privateKey: "your-private-key", 
    urlEndpoint: "https://ik.imagekit.io/your-imagekit-id"
});
```

## 📦 Dependencies

### Frontend
- Angular 17
- HttpClient for API calls
- FormsModule for input handling

### Backend
- Express.js
- ImageKit SDK
- CORS middleware

## 🔒 Security Notes

- Private keys are stored on the backend only
- Frontend only sends base64 image data
- No sensitive data exposed to client-side
- Environment variables should be used for production

## 🐛 Troubleshooting

### Common Issues

1. **Upload Fails**: Check if backend server is running
2. **Camera Not Working**: Ensure HTTPS in production
3. **CORS Errors**: Verify backend CORS configuration
4. **ImageKit Errors**: Check API credentials

### Port Conflicts

- **Frontend**: Change port in `angular.json` or use `ng serve --port 4201`
- **Backend**: Change port in server file or use environment variable

## 📄 License

This project is for educational/demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy Party Photo Uploading! 📸🎉**
