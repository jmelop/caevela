import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @react-three/postprocessing pulls the core `postprocessing` lib, which can
  // resolve a second copy of three; dedupe so the whole app shares one instance.
  resolve: { dedupe: ['three', '@react-three/fiber', 'react', 'react-dom'] },
})
