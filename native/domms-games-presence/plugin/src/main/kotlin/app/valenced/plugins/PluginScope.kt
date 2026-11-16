package app.valenced.plugins

import java.io.File
import app.valenced.xposed.api.HostScope

interface PluginScope : HostScope {
    val pluginDir: File
}
