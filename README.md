<img src="https://raw.githubusercontent.com/vandenberghinc/vlib/master/dev/media/icon/icon.green.png" width="150" alt="VLib">

**VLib** is an open-source, general-purpose TypeScript library (developed by Van Den Bergh Inc.) providing a broad range of utilities and tools for application development. It aims to serve as a "standard library" extension for TypeScript/JavaScript, delivering functionality from data structures and system utilities to CLI tools and testing frameworks. While the repository includes a comprehensive C++ codebase, this README focuses on the TypeScript library.

## Documentation.
Full documentation at [Github Pages](https://vandenberghinc.github.io/vlib).

## Features

- **CLI Framework:** Easily create command-line interfaces with nested commands and option parsing using a high-level API (the `CLI` class and related utilities).
- **Unit Testing (VTest):** A built-in unit testing framework with a CLI runner (`vtest`) supporting test filtering, interactive mode, and result reporting.
- **Repository Management (VRepo):** A CLI tool (`vrepo`) to streamline project version control and publishing workflows (e.g. pushing/pulling to multiple Git/SSH remotes and publishing packages to npm).
- **TypeScript Build Tools (VTS):** A TypeScript compiler plugin/CLI for automating source transformations (inserting `__dirname`/`__filename` in ESM modules, updating file headers, injecting version numbers, etc.) and post-processing build outputs.
- **Data Validation (Scheme):** A flexible schema validation system to define the shape of objects (with types, required fields, default values, nested schemas, etc.) and validate or transform data at runtime.
- **System Utilities:** Cross-platform abstractions for environment variables, file paths, and other system interactions (with Node and browser support where applicable).
- **Networking Helpers:** Simplified HTTP/HTTPS request function and WebSocket client utility for basic networking tasks.
- **Utilities & Helpers:** Miscellaneous helpers such as colored logging (`logger`, `debug`, `print`), cryptographic hashing functions, JSON-with-comments parsing (JSONC), deep object cloning, debounce and delay functions, and more.

## Installation

VLib is available as an npm package. Install it into your project with:

```bash
npm install @vandenberghinc/vlib
```

This will install the library locally. You can also install globally (e.g. `npm install -g @vandenberghinc/vlib`) to gain access to the provided CLI tools (`vtest`, `vrepo`, and `vts` on your PATH).

## Usage

After installation, you can import and use VLib in your TypeScript or Node.js project:

```ts
import * as vlib from '@vandenberghinc/vlib';

// Example: Validating an object with a Scheme (schema)
const userSchema = {
  name: { type: 'string', required: true },
  age:  { type: 'number', default: 18 }
};
const userData = { name: "Alice" };
const validated = vlib.Scheme.verify({ object: userData, scheme: userSchema });
// validated is now { name: "Alice", age: 18 } with defaults applied
```

In Node.js, the library's global type extensions are loaded when you import the main module. **Always import `@vandenberghinc/vlib`** before using extended methods on built-ins to avoid runtime errors.

### CLI Tools

VLib comes with optional CLI utilities if installed globally or invoked via `npx`:

- **`vtest`:** Run unit tests defined with the VTest framework. Example usage:
  ```bash
  vtest --import dist/tests/module1.test.js --results ./test-results/
  ```
  This command will execute the specified test module and output results to the given directory. VTest supports additional flags for filtering tests, interactive selection, repeating tests, and debugging output.

- **`vrepo`:** Manage project repositories and publishing. For example:
  ```bash
  vrepo --push --git --ssh
  ```
  This would push the current project to all configured Git and SSH remotes. VRepo supports various modes and options to pull changes, publish to npm (`--publish-npm`), add new remotes, remove commit history, list large files, link local dependencies, and more – streamlining release workflows.

- **`vts`:** TypeScript build assistant for pre- and post-processing. For instance, you can use `vts` to transform ESM output to CommonJS:
  ```bash
  vts --transform-esm --src dist/esm/ --dest dist/cjs/ --override
  ```
  or to automatically insert version numbers and environment-specific code in compiled files. `vts` is typically used in build scripts to automate these kinds of tasks.

## Project Structure

VLib is organized into multiple modules, each targeting a specific area:

- **Global & Utilities:** Core utilities and global type extensions (found under `global/` and `utils.ts`) which enhance built-in types and provide generic helper functions.
- **CLI Module:** Classes for building CLI applications (`cli/` folder), including `CLI`, `Command`, `Arg`, and `Query` for defining commands and parsing arguments.
- **Logging & Debugging:** Logging utilities (`logging/`) offering a configurable logger and convenience functions (`log`, `warn`, `error`) with colored output, as well as debugging helpers (`debugging/`) to control verbosity and print structured debug messages.
- **Data Validation:** The `Scheme` module (`scheme/`) for defining object schemas and verifying objects against them, useful for configuration validation or input checking.
- **System & Environment:** The `system/` utilities cover environment variable management, file system paths (via a `Path` class), color constants for terminal output, and other system-level helpers.
- **Networking:** The `sockets/` module provides a simple HTTP/HTTPS request function and WebSocket client, abstracting Node.js networking APIs for ease of use.
- **JSONC:** JSON-with-comments support (`jsonc/`) allowing you to parse JSON or config files that include comments.
- **Crypto:** Basic cryptography helpers (`crypto/`), such as hashing utilities (e.g. generating SHA-256 digests via Node's crypto module).
- **VTest:** The unit testing library (`libs/vtest/`) enabling you to write tests that can be executed with the `vtest` CLI, including features like selective test runs and result output to files.
- **VRepo:** The repository management library (`libs/vrepo/`), which underpins the `vrepo` CLI commands for multi-remote Git/SSH operations and npm publishing automation.
- **VTS:** The TypeScript pre/post-processing tools (`libs/vts/`), used internally and available for custom build processes (e.g. adding boilerplate to compiled outputs or performing text transformations on generated code).

> **Note:** Many parts of VLib are designed to work in both Node.js and browser environments. For example, the validation, utility, and data structures modules can be used in web applications, while certain modules are Node-specific (such as the CLI framework and file system tools). The build system produces separate bundles for Node (CommonJS and ESM) and for web (bundled ESM) to ensure compatibility across environments.
