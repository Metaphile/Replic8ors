## Build System

- Use `npm` scripts ([article](http://gon.to/2015/02/26/gulp-is-awesome-but-do-we-really-need-it/))

- [`browserify`](http://browserify.org/#install) to bundle modules

- `package.json` scripts check `./node_modules/.bin` first, so no need to prefix local packages with `$(npm bin)`

- http://stackoverflow.com/a/32929589/40356


## Unit Testing

- Consider using [`tape`](https://github.com/substack/tape) for unit testing ([`faucet`](https://github.com/substack/faucet) for formatting output)


## Notes


- Predators should gradually drain energy instead of insta-killing

	- But then replicators would need a clear, direct signal that they're taking damage


- Why do we need custom replicators? The symmetric copy function only requires a network. We can use standard replicators for testing simulation scenarios. We can override properties as needed.
