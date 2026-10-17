// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'


// export default defineConfig({
//   base: '/Gabonlivraison/',
//   plugins: [react()],
// })


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   base: '/',
//   plugins: [react()],

//   server: {
//     host: '192.168.100.7',
//     port: 5173,
//   },
// })



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   base: '/',
//   plugins: [react()],

//   server: {
//     host: '0.0.0.0',
//     port: 5173,

//     allowedHosts: [
//       'unmanipulable-creedless-pedro.ngrok-free.dev',
//     ],
//   },
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mon-projet/',
})
