@file:JvmName("DommsGamesPresence")
package com.domms.presence

import android.app.Activity
import android.os.Build
import android.util.Log
import app.valenced.plugins.plugin
import app.valenced.xposed.api.registerNativeMethod
import com.discord.socialsdk.DiscordSocialSdkInit
import java.io.File

private object PresenceNative {
    external fun update(applicationId: String, gameName: String, details: String, state: String): Boolean
    external fun clear(): Boolean
}

private fun loadSdk(activity: Activity, pluginDir: File) {
    val abi = Build.SUPPORTED_ABIS.firstOrNull { it in setOf("arm64-v8a", "armeabi-v7a", "x86_64") }
        ?: error("This device ABI is not packaged")
    val sdk = File(pluginDir, "lib/$abi/libdiscord_partner_sdk.so")
    val bridge = File(pluginDir, "lib/$abi/libdomms_presence.so")
    require(sdk.isFile && bridge.isFile) { "Discord SDK native libraries are missing for $abi" }
    // The SDK Java class loads its native library in its static initializer.
    // Load from the plugin's private directory before touching DiscordSocialSdkInit.
    System.load(sdk.absolutePath)
    DiscordSocialSdkInit.setEngineActivity(activity)
    System.load(bridge.absolutePath)
}

val dommsGamesPresence = plugin {
    start {
        var sdkReady = false
        var sdkFailure = "Discord Social SDK is still initializing."
        withAppActivity { activity ->
            if (!sdkReady) {
                try {
                    loadSdk(activity, pluginDir)
                    sdkReady = true
                    Log.i("DommsGamesPresence", "Discord Social SDK native bridge loaded.")
                } catch (t: Throwable) {
                    sdkFailure = t.message ?: t.javaClass.simpleName
                    Log.e("DommsGamesPresence", "Failed to initialize Discord Social SDK", t)
                }
            }
        }
        registerNativeMethod("domms.presence.update") { args ->
            check(sdkReady) { sdkFailure }
            val appId = args.getOrNull(0)?.toString()?.trim().orEmpty()
            val gameName = args.getOrNull(1)?.toString()?.trim().orEmpty()
            val details = args.getOrNull(2)?.toString().orEmpty()
            val state = args.getOrNull(3)?.toString().orEmpty()
            require(appId.matches(Regex("[0-9]{17,20}"))) { "Enter a valid registered Discord Application ID" }
            require(gameName.isNotBlank() && gameName.length <= 128) { "Game name must be 1–128 characters" }
            require(details.length <= 128 && state.length <= 128) { "Details and state must be 128 characters or fewer" }
            check(PresenceNative.update(appId, gameName, details, state)) {
                "Discord did not accept the Rich Presence update. Check that Discord is installed, signed in, and the Application ID is valid."
            }
            mapOf("ok" to true)
        }
        registerNativeMethod("domms.presence.clear") {
            check(sdkReady) { sdkFailure }
            check(PresenceNative.clear()) { "Could not clear Rich Presence" }
            mapOf("ok" to true)
        }
    }
}
