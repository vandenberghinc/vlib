# Project: Libris

Volt is a library for creating a backend web server and a library for creating frontend content in a SwiftUI like style.

## Coding Standards
- Use **snake_case** for variables, functions, files
- Use **PascalCase** for classes, namespaces, interfaces, types
- **4 spaces** for indentation
- TypeScript strict mode, never use `as any` casts.
- Ensure that each class, function, method, interface,  interface property has a concise-docstring in JSDoc style. If an object-typed parameter holds nested properties, then document those properties with a separate docstring, instead of defining them in the function docstring.
- Write inline comments, like you are a developer explaining sections of the code so the code is easy to understand.
- Prefer listing types that are used by a class or namespace under the namespace itself. For instance if there is a class called `MyClass`, then dont create a type for constructor options called `MyClassOpts` instead create an `Opts` type under namespace `MyClass`.
- Never remove `@todo`, `@warning`, `@note` comment blocks
- Use named exports, not default exports.
- Ensure each file starts with a author & copyright docstring: `/** @author Daan van den Bergh @copyright © YEAR - YEAR Daan van den Bergh. All rights reserved. */`. Also ensure that the second YEAR is the current year.
- Never write code that is not suitable for production.
- Never write code that is not safe security wise.
- After generating new code, perform a thorough audit of the code and triple check if everything is correct.

## Commands

- `npm run build` - Compile all TS.

## Architecture

- `./ts/` - All typescript source files.
- `./cpp/` - All cpp source files, deprecated dont use this.
- `./dev/` - Dont use this directory.

## Important notes
- Never use the `dist/` directory to read and understand code, always use the `src/` directory.


## Documentation
Ensure every class, type, function, method, interface, interface property has a docstring.

### JSDoc format
The docstring format supports the following custom tags.
- `@note <description>` add a note, supports multiple notes on a single docstring.
- `@warning <description>` add a warning, supports multiple warnings on a single docstring.
- `@see Some description with a {@link X}` See also description, should always include a `{@link ...}`.
- `@docs` Add this to symbols that should be present in the documentation, only for symbols that are public / exported. Add this to the end of the docstring. Note that these should also be added to classes, interfaces and types if they need to be documented. Note that when there is both a namespace and a class with the same name, then only use the `@docs` tag on the class, and not on the namespace as well.

### Rules
Prefer writing multi line docstrings that like
```ts
/**
 * Descr
 * @param etc
 */
```
Instead of 
```ts
/** Some descri
 * @param etc */
```

When writing `@example` tags, write them as follows with a title, description and a codeblock. Dont include multiple code blocks in a single `@example` tag, instead write multiple `@example` tags.
```ts
/**
 * @example
 * {Title}
 * Some description
 * ```<codelanguage>
 * ...
 * ```
 */
```

### Example docstring
Note that when a function has a object-like parameter, then instead of writing `@param obj.prop XXX` docstrings, we simply write the docstring on the type object property as seen below. This is the same for the return type, also ensure those fields have a docstring.
```ts
/**
 * Some description
 * @param opts Input options.
 * @returns Some output object.
 * 
 * @docs
 */
function my_func(opts: {
    /** Some input field. */
    input: string;
}): {
    /** Some response field. */
    field: string;
} {
    return ...
}
```
