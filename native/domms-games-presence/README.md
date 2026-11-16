# Domms Games Presence native bridge

Android native half for the Valenced Rich Presence plugin. It uses the Discord Social SDK AAR attached to this repository's `discord-sdk-v1` release.

**Discord limitation:** Rich Presence is associated with a registered Discord Application ID. The SDK does not provide a supported way to impersonate an unrelated verified game by swapping its ID. A selected game title can be shown in activity details/state, while the registered application's identity remains controlled by Discord.

The build workflow downloads the attached AAR, compiles a JNI bridge for Android ABIs, and publishes the Android library as a CI artifact. This is native integration source, not yet a verified installable Valenced ZIP. It must still be packaged with the JS settings interface and tested in Valenced.
