@file:JvmName("DommsGamesPresence")
package com.domms.presence

import android.app.Activity
import android.os.Build
import app.valenced.plugins.plugin
import app.valenced.xposed.api.registerNativeMethod
import com.discord.socialsdk.DiscordSocialSdkInit
import java.io.File

private object PresenceNative {
    external fun update(applicationId: String, details: String, state: String): Boolean
    external fun clear(): Boolean
}

private fun loadSdk(activity: Activity, pluginDir: File) {
    DiscordSocialSdkInit.setEngineActivity(activity)
    val abi = Build.SUPPORTED_ABIS.firstOrNull { it in setOf("arm64-v8a", "armeabi-v7a", "x86_64") }
        ?: error("This device ABI is not packaged")
    val sdk = File(pluginDir, "lib/$abi/libdiscord_partner_sdk.so")
    val bridge = File(pluginDir, "lib/$abi/libdomms_presence.so")
    require(sdk.isFile && bridge.isFile) { "Discord SDK native libraries are missing for $abi" }
    System.load(sdk.absolutePath)
    System.load(bridge.absolutePath)
}

val dommsGamesPresence = plugin {
    start {
        withAppActivity { activity ->
            try {
                loadSdk(activity, pluginDir)
                registerNativeMethod("domms.presence.update") { args ->
                    val appId = args.getOrNull(0)?.toString()?.trim().orEmpty()
                    val details = args.getOrNull(1)?.toString().orEmpty()
                    val state = args.getOrNull(2)?.toString().orEmpty()
                    require(appId.matches(Regex("[0-9]{17,20}"))) { "Enter a valid registered Discord Application ID" }
                    require(details.length <= 128 && state.length <= 128) { "Details and state must be 128 characters or fewer" }
                    check(PresenceNative.update(appId, details, state)) { "Discord rejected the Rich Presence update" }
                    mapOf("ok" to true)
                }
                registerNativeMethod("domms.presence.clear") {
                    check(PresenceNative.clear()) { "Could not clear Rich Presence" }
                    mapOf("ok" to true)
                }
                log.i("Discord Social SDK native bridge loaded.")
            } catch (t: Throwable) {
                errors.tryEmit(t)
                log.e("Failed to initialize Discord Social SDK", t)
            }
        }
    }
}
