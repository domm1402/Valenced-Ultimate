pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://maven.pkg.github.com/Valenced/valenced"); credentials {
            username = providers.environmentVariable("GITHUB_ACTOR").orNull ?: ""
            password = providers.environmentVariable("GITHUB_TOKEN").orNull ?: ""
        } }
    }
}
rootProject.name = "DommsGamesPresence"
include(":plugin")
