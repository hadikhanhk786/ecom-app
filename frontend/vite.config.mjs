import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-window']
  },
  // resolve: {
  //   alias: {
  //     // Force resolution for react-window
  //     'react-window': 'react-window/dist/index.esm.js'
  //   }
  // },
  server: { port: 5173 }
});

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     include: ['react-window']
//   },
//   resolve: {
//     alias: {
//       // Force resolution for react-window
//       'react-window': 'react-window/dist/index.esm.js'
//     }
//   }
// });
