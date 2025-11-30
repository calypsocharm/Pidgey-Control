import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Your backend API URL for the Control Tower
const BACKEND_API_URL = 'https://backend-api-600206000330.us-west1.run.app';

export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    // 1. Proxy Setup: Intercept requests starting with '/admin'
    proxy: {
      '/admin': {
        // The URL of your remote backend API
        target: BACKEND_API_URL, 
        
        // Key for handling requests to a different host
        changeOrigin: true, 
        
        // This is important because your backend is HTTPS
        secure: true, 
      },
    },
  },

  // Ensure the build output directory matches the vercel.json configuration
  build: {
    outDir: 'dist',
  },
});