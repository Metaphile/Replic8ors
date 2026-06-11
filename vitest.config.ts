import { defineConfig } from 'vitest/config'

export default defineConfig( {
	test: {
		// Jasmine-style global describe/it/expect (legacy specs rely on these).
		globals: true,
		// default to node; specs that need the DOM opt in per-file with
		// `// @vitest-environment happy-dom`.
		environment: 'node',
		include: [ 'source/**/*.spec.ts' ],
	},
} )
