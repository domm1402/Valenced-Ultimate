package app.valenced.plugins

class PluginBuilder {
    fun start(block: PluginScope.() -> Unit) {}
}

fun plugin(block: PluginBuilder.() -> Unit): PluginBuilder = PluginBuilder().apply(block)
