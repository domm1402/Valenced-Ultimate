package app.valenced.xposed.api

import android.app.Activity

interface HostScope {
    fun withAppActivity(block: (Activity) -> Unit)
}

fun HostScope.registerNativeMethod(
    name: String,
    handler: (args: List<Any?>) -> Any?,
) {}
