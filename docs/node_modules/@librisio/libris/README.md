# Libris JavaScript Client
<p>
    <img src="https://img.shields.io/badge/version-1.1.5-blue" alt="Libris">
    <img src="https://img.shields.io/badge/status-maintained-forestgreen" alt="Libris">
</p> 

**Boost productivity with Libris: Automatically generate comprehensive modern documentation for your projects.**

![Libris Docs Banner](https://raw.githubusercontent.com/librisio/.github/master/media/github/readme_banner_rounded.png)

## Libris

Libris is an advanced documentation generation tool that automates the process of code documentation. It is designed to seamlessly integrate with the existing code development workflow, making it easy for developers to generate comprehensive and up-to-date documentation.
<br><br>
Libris works by analyzing the codebase and extracting relevant information, such as function signatures, class hierarchies, and variable descriptions. It then organizes this information into a structured and user-friendly format, generating documentation that is easy to navigate and understand. Libris supports multiple programming languages, making it a versatile tool for different development environments.
<br>

* [x] Supports C++, C, JavaScript Python, CLI and RESTAPI documentations.
* [x] Modern documentation layout.
* [x] Automatically generate documentation from source code and docstring comments.
* [x] Create custom pages using markdown, javascript and html.
* [x] Feedback features.
* [x] Embedded page analytics.
* [x] Custom themes.
* [x] Independent hosting.
* [x] Supports fully customizable syntax highlighting.
* [x] Supports GitHub Pages.
* [x] Embedded search console.

## Documentation
More information regarding the libris client can be found in the [documentation](https://uselibris.io/docs).

## Integrating Libris
To document your code using Libris, simply place a structured comment block above the code you want to document. Libris will automatically parse important information such as the function name, return type, function keywords, parameters, templates, requires clause and more. The `@docs` tag is universal and can be used with all supported languages.
<hbr>
```cpp
/*  @docs:
 *  @title: Load
 *  @description: Load a file.
 *  @parameter:
 *      @name: path
 *      @description: The path of the file.
 *  @usage:
 *      char* data = load("./myfile.txt");
 */
char*  load(const char* path) { ... }
```
More information can be found in the [Documentation](https://uselibris.io/docs).

## Obtain your API Key.
The Libris Client requires an [API Key](https://uselibris.io/docs?id=Authentication:API%20Key).

<!-- 
    Template:
    https://github.com/colinwilson/lotusdocs/blob/release/README.md
-->