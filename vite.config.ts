import { defineConfig } from 'vite'

export default defineConfig( {
	// keep the dev server on 8080 to match .vscode/launch.json and main.ts's
	// localhost host check.
	server: {
		port: 8080,
	},
	build: {
		outDir: 'build',
		emptyOutDir: true,
	},
} )
