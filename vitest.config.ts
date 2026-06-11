import { defineConfig } from 'vitest/config'

export default defineConfig( {
	test: {
		// Jasmine-style global describe/it/expect (legacy specs rely on these).
		globals: true,
		// default to node; specs that need the DOM opt in per-file with
		// `// @vitest-environment happy-dom`.
		environment: 'node',
		include: [ 'source/**/*.spec.ts' ],
		// TODO Phase 2: re-enable once the runtime EJS templates are rewritten as
		// TS. These specs transitively import .ejs files, which the bundler can't
		// parse yet (control-bar -> form.ejs/info.ejs; visualization -> control-bar).
		exclude: [
			'**/node_modules/**',
			'source/control-bar/control-bar.spec.ts',
			'source/visualization/visualization.spec.ts',
			// Its only real assertions cover the pure getSignalParts(), but the
			// import chain (replicator-assets -> prey-assets) builds canvas
			// gradients at module load, needing a real 2D context. TODO Phase 5:
			// extract getSignalParts into a pure .model.ts and test it there.
			'source/visualization/replicator-view.spec.ts',
		],
	},
} )
