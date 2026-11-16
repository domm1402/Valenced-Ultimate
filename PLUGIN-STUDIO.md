# Valenced Plugin Studio APK

An Android app for creating Valenced plugin projects with a beginner-friendly TypeScript editor.

## Features

- Offline TypeScript-to-JavaScript transpilation using the TypeScript compiler bundled into the APK.
- Basic syntax diagnostics with line numbers where available.
- Starter templates, including Hello World, plugin lifecycle, settings, and event-listener examples.
- Editor productivity tools: find/replace, whitespace cleanup, and insertion of common code snippets.
- A basic static safety audit for suspicious credential handling, dynamic code execution, network URLs, listeners, and external imports.
- Plugin details and manifest editor with basic validation.
- Local draft save/load and ZIP export containing source, compiled JavaScript and manifest.
- Beginner help covering the build process, common syntax mistakes and safe plugin habits.

## Download

Open the repository Actions tab, run **Build Plugin Studio APK**, then download the **valenced-plugin-studio-apk** artifact from the completed run. The workflow installs TypeScript 5.9.3 and copies its compiler into the Android assets before building the APK.

## What compilation means here

The in-app compiler transpiles TypeScript syntax into JavaScript. It does not perform full project type-checking, resolve third-party packages, or bundle imports. If your plugin imports Valenced or other packages, build the exported project with the Valenced plugin CLI/repository build so dependencies are bundled correctly. The app does not execute plugin code.

## Local build

Install JDK 17, Android SDK, Gradle 8.9+ and Node.js/npm. Before building, install TypeScript and copy the compiler into the assets folder:

    npm install --prefix /tmp/plugin-studio-ts typescript@5.9.3
    mkdir -p plugin-studio/app/src/main/assets
    cp /tmp/plugin-studio-ts/node_modules/typescript/lib/typescript.js plugin-studio/app/src/main/assets/tsc.js
    cd plugin-studio
    gradle assembleDebug

The resulting APK is at `app/build/outputs/apk/debug/app-debug.apk`.

Only install plugin code you understand and trust. Never put your Discord password or account token in a plugin.
