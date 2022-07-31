# ApiDOM VS Code Extension

## Functionality

This extension is based on [ApiDOM](https://github.com/swagger-api/apidom) and provides the following:

* Rich editor for multiple languages, currently supporting [OpenAPI](https://www.openapis.org/), [AsyncAPI](https://www.asyncapi.com/), [API Design Systems](https://apidesign.systems/):
  - documentation
  - validation
  - linting (custom rules)
  - navigation
  - completion
  - semantic syntax highlighting

* Preview pane for API specification documents


## Structure

```
.
├── client // VS Code Language Client + Extension
│   ├── src
│   │   ├── test // End to End tests for Language Client / Server
│   │   └── extension.ts // Language Client entry point
├── package.json // The extension manifest.
└── server // Language Server
    └── src
        ├── test // LSP Server tests
        └── server.ts // Language Server entry point, uses apidom-ls
```


## Getting started

Some of npm packages that this extension depends on are currently hosted on [GitHub packages registry](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages).
For more information about installing npm packages from GitHub packages registry please visit [Installing a package](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package)
section in their documentation.

### Clone the GitHub repository

```sh
 $ git clone https://github.com/swagger-api/apidom-lsp-vscode.git
 $ cd apidom-lsp-vscode
```

### Prerequisites

[Node.js](https://nodejs.org/) >= 16.13.2 and `npm >= 8.1.02` are the minimum required versions that this repo runs on.
We recommend using the latest version of Node.js@16 though. We're using [node-gyp](https://www.npmjs.com/package/node-gyp) to build some fragments that require [Python 3.x](https://www.python.org/downloads/).
[emscripten](https://emscripten.org/docs/getting_started/downloads.html) or [docker](https://www.docker.com/) needs to be installed
on your operating system. We strongly recommend going with a docker option.
[VS Code IDE](https://code.visualstudio.com/) needs to be installed on your system.

### Installation

```shell
 $ npm install
 $ npm run build
```

### Run VS Code extension in VSCode instance

- Open VS Code
- Open this repository in VS Code: `File` -> `Open Folder`
- From `Activity Bar`, click on `Run and Debug` icon
- Select `Launch Client` from the dropdown menu
- Run the launch config by clicking on small green play button
- If you want to debug the server as well use the launch configuration `Attach to Server`
- New VS Code window will open where ApiDOM VS Code Extension is loaded in
- Create new text file: `File` -> `New Text File`
- Start writing your specification document (OpenAPI, AsyncAPI, API Design Systems)

### Specification preview

You can preview your specification document by right mouse click -> `Command Pallete` -> `Show Preview using SwaggerUI`.
The pane with rendered specification document is opened and re-rendered whenever you editor the
specification document.

### Test Server component

```sh
 $ npm run test
```
