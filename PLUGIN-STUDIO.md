# Valenced Plugin Studio APK

An Android app for editing TypeScript plugin source and Valenced manifests, validating basic metadata, saving drafts locally, and exporting a ZIP with the expected plugin folder structure.

## Download

Open the repository Actions tab, run **Build Plugin Studio APK**, then download the **valenced-plugin-studio-apk** artifact from the completed workflow. Changes under plugin-studio also trigger a build. The artifact contains app-debug.apk.

## Local build

Install JDK 17, Android SDK and Gradle 8.9+, then run:

    cd plugin-studio
    gradle assembleDebug

The app is an editor and packager, not a runtime. It does not execute plugin code or bypass Valenced APIs, Discord permissions, Nitro entitlements, or client security controls. Build exported projects with the Valenced plugin CLI before publishing.
