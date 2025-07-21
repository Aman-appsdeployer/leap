// import react from "@vitejs/plugin-react";
// import path from "path";
// import { defineConfig } from "vite";

// export default defineConfig({
//     plugins: [react()],
//     resolve: {
//         alias: {
//             "@": path.resolve(__dirname, "./src"),
//         },
//     },
// });



import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the TS path so IDE + Vite agree
      '@': resolve(__dirname, 'src'),
    },
  },
  // server: {
  //       host: "209.182.233.188", 
  //       port: 5173,
  //       strictPort: true,
  //   },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

});

