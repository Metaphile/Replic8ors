import { defineConfig } from 'vitest/config'

export default defineConfig( {
	test: {
		// Jasmine-style global describe/it/expect (legacy specs rely on these).
		globals: true,
		// default to node; specs that need the DOM opt in per-file with
		// `// @vitest-environment happy-dom`.
		environment: 'node',
		include: [ 'source/**/*.spec.ts' ],
		exclude: [
			'**/node_modules/**',
			// These import the visualization layer, whose asset modules
			// (replicator-assets -> prey-assets) build canvas gradients at module
			// load, needing a real 2D context the headless DOM lacks.
			// visualization.spec is an empty placeholder; replicator-view.spec's
			// only real assertions cover the pure getSignalParts().
			// TODO Phase 5: extract getSignalParts into a pure .model.ts, test it
			// there, and verify rendering in-browser.
			'source/visualization/visualization.spec.ts',
			'source/visualization/replicator-view.spec.ts',
		],
	},
} )
