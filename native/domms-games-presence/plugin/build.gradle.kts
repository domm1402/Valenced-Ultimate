plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.domms.presence"
    compileSdk = 35
    defaultConfig {
        minSdk = 24
        ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64") }
        externalNativeBuild { cmake { cppFlags += listOf("-std=c++20", "-fexceptions", "-frtti") } }
    }
    sourceSets.getByName("main").jniLibs.srcDirs("src/main/jniLibs")
    externalNativeBuild { cmake { path = file("src/main/cpp/CMakeLists.txt"); version = "3.22.1" } }
}
dependencies {
    compileOnly("app.valenced:api:1.1.0")
    compileOnly(files("libs/discord_partner_sdk.jar"))
}
