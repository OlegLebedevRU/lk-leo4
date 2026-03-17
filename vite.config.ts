import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    outDir: './dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2100,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons', '@ant-design/pro-components', '@ant-design/pro-provider'],
          'vendor-utils': ['axios', 'react-syntax-highlighter'],
        },
      },
    },
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [react()],
  publicDir: 'public',
})
