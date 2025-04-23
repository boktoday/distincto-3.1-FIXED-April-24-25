import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'; // Import resolve

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Ensure files in the public directory are copied correctly
  publicDir: 'public',
  build: {
    rollupOptions: {
      // Optional: If you have specific input needs, define them here
      // input: {
      //   main: resolve(__dirname, 'index.html'),
      // }
    },
    // Ensure the service worker is included in the build output if not handled by publicDir
    // assetsInclude: ['sw.js'], // Usually not needed if sw.js is in publicDir
  }
})
