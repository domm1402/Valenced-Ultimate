package com.nichegames.valencedpluginstudio

import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.content.Intent
import android.graphics.Color
import android.util.Base64
import android.view.Gravity
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class MainActivity : Activity() {
    private val bg = Color.rgb(15, 19, 29)
    private val panel = Color.rgb(27, 34, 50)
    private val accent = Color.rgb(121, 102, 239)
    private val muted = Color.rgb(164, 176, 199)
    private lateinit var root: LinearLayout
    private lateinit var nameField: EditText
    private lateinit var idField: EditText
    private lateinit var authorField: EditText
    private lateinit var versionField: EditText
    private lateinit var descriptionField: EditText
    private lateinit var codeField: EditText
    private lateinit var manifestField: EditText
    private lateinit var outputView: TextView
    private lateinit var statusView: TextView
    private lateinit var engine: WebView
    private var engineReady = false
    private var compiledJs = ""
    private var pendingZip: ByteArray? = null
    private var activeSection: LinearLayout? = null

    private val helloTemplate = """export default {
  onLoad() {
    console.log("Hello from my first plugin!");
  },
  onUnload() {
    console.log("Goodbye!");
  }
};"""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = bg
        window.navigationBarColor = bg
        buildUi()
        buildCompiler()
        loadDraft(false)
        refreshManifest()
    }

    @Suppress("SetJavaScriptEnabled")
    private fun buildCompiler() {
        engine = WebView(this)
        engine.visibility = View.GONE
        root.addView(engine, 0, LinearLayout.LayoutParams(1, 1))
        engine.settings.javaScriptEnabled = true
        engine.addJavascriptInterface(CompilerBridge(), "AndroidBridge")
        engine.webChromeClient = WebChromeClient()
        engine.webViewClient = object : android.webkit.WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                engineReady = true
                setStatus("Compiler ready. You can work offline.")
            }
        }
        engine.loadDataWithBaseURL(
            "file:///android_asset/",
            "<html><head><script src='tsc.js'></script></head><body></body></html>",
            "text/html",
            "UTF-8",
            null
        )
    }

    private fun buildUi() {
        val scroll = ScrollView(this)
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(18), dp(16), dp(28))
            setBackgroundColor(bg)
        }
        scroll.addView(root)
        setContentView(scroll)

        text("VALENCED  /  DEVELOPER TOOLS", 11, accent, true)
        text("Plugin Studio", 28, Color.WHITE, true)
        text("Create, edit, compile and export Valenced plugin projects.", 14, muted)

        section("1. Plugin details")
        nameField = input("Plugin name", "My First Plugin")
        idField = input("Plugin ID", "niche.my-first-plugin")
        authorField = input("Author", "Plugin Developer")
        versionField = input("Version", "1.0.0")
        descriptionField = input("Description", "A custom Valenced plugin.")

        section("2. TypeScript editor")
        text("Choose a starter, edit the source, then compile it to JavaScript.", 12, muted)
        button("Hello world template") { codeField.setText(helloTemplate); setStatus("Template loaded.") }
        button("Plugin lifecycle template", false) {
            codeField.setText("""// onLoad runs when the plugin starts.
// onUnload runs when it is stopped.
export default {
  onLoad() {
    console.log("Plugin enabled");
  },
  onUnload() {
    console.log("Plugin disabled");
  }
};""")
            setStatus("Lifecycle template loaded.")
        }
        codeField = input("TypeScript source", helloTemplate, multiline = true, height = 250)
        button("Find and replace", false) { findAndReplace() }
        button("Format code", false) { formatCode() }
        button("Insert code snippet", false) { insertSnippet() }
        button("Plugin safety audit", false) { runSafetyAudit() }
        button("Settings plugin template", false) { codeField.setText(settingsTemplate()); setStatus("Settings template loaded.") }
        button("Event listener template", false) { codeField.setText(eventTemplate()); setStatus("Event template loaded. Confirm API names first.") }
        button("Code statistics", false) { showCodeStatistics() }
        button("Valenced plugin API checklist", false) { showApiChecklist() }
        button("Clear editor", false) { confirmClearEditor() }
        button("Compile TypeScript") { compileSource() }
        statusView = text("Compiler starting…", 12, muted)

        section("3. Compiled JavaScript")
        outputView = text("// Compiled JavaScript appears here.", 12, Color.rgb(190, 220, 199))
        button("Copy JavaScript", false) {
            if (compiledJs.isBlank()) setStatus("Compile your source first.")
            else {
                val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
                clipboard.setPrimaryClip(android.content.ClipData.newPlainText("Compiled JavaScript", compiledJs))
                setStatus("JavaScript copied.")
            }
        }

        section("4. Plugin manifest")
        button("Update manifest from details", false) { refreshManifest() }
        manifestField = input("manifest.json", "{}", multiline = true, height = 190)
        button("Validate manifest", false) { validateManifest() }

        section("5. Save and export")
        button("Save draft on this device", false) { saveDraft() }
        button("Load saved draft", false) { loadDraft(true) }
        button("Export plugin ZIP") { exportZip() }

        section("6. Help")
        text("Compile converts TypeScript into JavaScript. The ZIP contains your manifest, TypeScript source, compiled JavaScript and a README. External imports are not bundled automatically; use the Valenced CLI for dependency bundling.", 12, muted)
        text("Only install plugins from developers you trust. Plugins can execute code inside your Discord client. Never put your account token or password in a plugin.", 12, Color.rgb(255, 184, 150))
    }

    private fun section(title: String) {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(13), dp(13), dp(13), dp(13))
            setBackgroundColor(panel)
        }
        val lp = LinearLayout.LayoutParams(-1, -2)
        lp.topMargin = dp(16)
        root.addView(box, lp)
        val heading = TextView(this).apply {
            text = title
            textSize = 16f
            setTextColor(Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        box.addView(heading)
        activeSection = box
    }

    private fun text(value: String, size: Int, color: Int, bold: Boolean = false): TextView {
        val view = TextView(this).apply {
            text = value
            textSize = size.toFloat()
            setTextColor(color)
            if (bold) setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(0, dp(5), 0, dp(5))
        }
        (activeSection ?: root).addView(view)
        return view
    }

    private fun input(label: String, value: String, multiline: Boolean = false, height: Int = 0): EditText {
        val container = activeSection ?: root
        val caption = TextView(this).apply {
            text = label.uppercase()
            textSize = 10f
            setTextColor(muted)
            setPadding(0, dp(9), 0, dp(4))
        }
        container.addView(caption)
        val edit = EditText(this).apply {
            setText(value)
            textSize = 13f
            setTextColor(Color.WHITE)
            setHintTextColor(muted)
            setHint(label)
            setPadding(dp(10), dp(8), dp(10), dp(8))
            setBackgroundColor(Color.rgb(12, 17, 27))
            if (multiline) {
                setSingleLine(false)
                gravity = Gravity.TOP or Gravity.START
                minLines = 5
            } else setSingleLine(true)
        }
        container.addView(edit, LinearLayout.LayoutParams(-1, if (multiline && height > 0) dp(height) else -2))
        return edit
    }

    private fun button(label: String, primary: Boolean = true, action: () -> Unit) {
        val b = Button(this).apply {
            text = label
            textSize = 12f
            isAllCaps = false
            setTextColor(Color.WHITE)
            setBackgroundColor(if (primary) accent else Color.rgb(54, 65, 88))
            setOnClickListener { action() }
        }
        val lp = LinearLayout.LayoutParams(-1, -2)
        lp.topMargin = dp(7)
        (activeSection ?: root).addView(b, lp)
    }


    private fun findAndReplace() {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(8), dp(18), 0) }
        val find = EditText(this).apply { hint = "Find text"; setSingleLine(true) }
        val replacement = EditText(this).apply { hint = "Replace with"; setSingleLine(true) }
        box.addView(find)
        box.addView(replacement)
        AlertDialog.Builder(this).setTitle("Find and replace").setView(box)
            .setPositiveButton("Replace all") { _, _ ->
                val needle = find.text.toString()
                if (needle.isBlank()) setStatus("Enter text to find.")
                else { codeField.setText(codeField.text.toString().replace(needle, replacement.text.toString())); setStatus("Replaced all matches.") }
            }.setNegativeButton("Cancel", null).show()
    }

    private fun formatCode() {
        val formatted = codeField.text.toString().lines().joinToString("\n") { it.trimEnd() }
            .replace(Regex("\n{3,}"), "\n\n")
        codeField.setText(formatted)
        setStatus("Removed trailing spaces and excess blank lines.")
    }

    private fun insertSnippet() {
        val snippets = arrayOf("Console log", "Settings object", "Lifecycle hooks", "API safety note")
        AlertDialog.Builder(this).setTitle("Insert snippet").setItems(snippets) { _, which ->
            val snippet = when (which) {
                0 -> "\nconsole.log('[Plugin] Ready');\n"
                1 -> "\nconst settings = { enabled: true, debug: false };\n"
                2 -> "\nonLoad() {\n  console.log('Plugin loaded');\n},\nonUnload() {\n  console.log('Plugin unloaded');\n}\n"
                else -> "\n// Use only APIs documented by your installed Valenced version.\n"
            }
            val start = codeField.selectionStart.coerceAtLeast(0)
            val end = codeField.selectionEnd.coerceAtLeast(start)
            codeField.text.replace(start, end, snippet)
        }.setNegativeButton("Cancel", null).show()
    }


    private fun settingsTemplate(): String = """// Starter example. Confirm APIs against your Valenced version.
const settings = { enabled: true, showNotifications: false };
export default {
  onLoad() { console.log("Settings plugin loaded", settings); },
  onUnload() { console.log("Settings plugin unloaded"); }
};"""

    private fun eventTemplate(): String = """// Register only documented events and remove listeners in onUnload.
export default {
  onLoad() { console.log("Ready to register supported event listeners"); },
  onUnload() { /* Remove listeners registered by this plugin. */ }
};"""

    private fun runSafetyAudit() {
        val source = codeField.text.toString()
        val findings = mutableListOf<String>()
        if (source.contains("authorization", true) || source.contains("discord token", true))
            findings.add("Possible credential handling. Never store or transmit Discord account tokens.")
        if (source.contains("eval(") || source.contains("new Function"))
            findings.add("Dynamic code execution detected. Avoid eval and Function.")
        if (source.contains("http://") || source.contains("https://"))
            findings.add("Network URL found. Verify the destination and data being sent.")
        if (source.contains("addListener") || source.contains("on("))
            findings.add("Possible event listener. Remove listeners in onUnload to prevent leaks.")
        if (source.contains("import ") || source.contains("require("))
            findings.add("Imports detected. The in-app compiler does not bundle dependencies. Use the Valenced CLI.")
        if (findings.isEmpty()) findings.add("No common risk patterns detected. This basic scan is not a security guarantee.")
        AlertDialog.Builder(this).setTitle("Plugin safety audit")
            .setMessage(findings.joinToString("\n\n") { "• " + it })
            .setPositiveButton("Done", null).show()
    }


    private fun showCodeStatistics() {
        val source = codeField.text.toString()
        val lines = if (source.isEmpty()) 0 else source.count { it == '\\n' } + 1
        val words = Regex("\\b\\w+\\b").findAll(source).count()
        val chars = source.length
        val bytes = source.toByteArray(Charsets.UTF_8).size
        AlertDialog.Builder(this).setTitle("Source statistics")
            .setMessage("Lines: $lines\\nWords: $words\\nCharacters: $chars\\nUTF-8 bytes: $bytes")
            .setPositiveButton("Done", null).show()
    }

    private fun showApiChecklist() {
        AlertDialog.Builder(this).setTitle("Before using a Valenced API")
            .setMessage("1. Check the API exists in your installed Valenced version.\\n\\n2. Confirm the exact event or module name.\\n\\n3. Register listeners only when the plugin loads.\\n\\n4. Remove listeners and timers in onUnload.\\n\\n5. Handle missing modules safely.\\n\\n6. Never access account tokens or send them to a server.\\n\\n7. Test in a separate account or test environment.")
            .setPositiveButton("Got it", null).show()
    }

    private fun confirmClearEditor() {
        AlertDialog.Builder(this).setTitle("Clear editor?")
            .setMessage("This clears the current source text. Save a draft first if you need it.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Clear") { _, _ -> codeField.setText(""); compiledJs = ""; outputView.text = "// Compile to generate JavaScript."; setStatus("Editor cleared.") }
            .show()
    }

    private fun compileSource() {
        if (!engineReady) {
            setStatus("Compiler is still loading. Try again in a moment.")
            return
        }
        val source = Base64.encodeToString(codeField.text.toString().toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
        val js = """
            (function(){
              try {
                if (!window.ts) throw new Error("TypeScript compiler asset is missing.");
                var source = decodeURIComponent(escape(atob('$source')));
                var result = ts.transpileModule(source, {
                  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
                  reportDiagnostics: true,
                  fileName: 'index.ts'
                });
                var errors = (result.diagnostics || []).filter(function(d){ return d.category === ts.DiagnosticCategory.Error; });
                var messages = errors.map(function(d){
                  var pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
                  return (pos ? 'Line ' + (pos.line + 1) + ': ' : '') + ts.flattenDiagnosticMessageText(d.messageText, ' ');
                });
                AndroidBridge.onResult(JSON.stringify({ok: errors.length === 0, output: result.outputText, errors: messages}));
              } catch (e) {
                AndroidBridge.onResult(JSON.stringify({ok:false, output:'', errors:[String(e.message || e)]}));
              }
            })();
        """.trimIndent()
        engine.evaluateJavascript(js, null)
        setStatus("Compiling…")
    }

    inner class CompilerBridge {
        @JavascriptInterface
        fun onResult(payload: String) {
            runOnUiThread {
                try {
                    val result = JSONObject(payload)
                    if (result.optBoolean("ok")) {
                        compiledJs = result.optString("output")
                        outputView.text = compiledJs
                        setStatus("Compiled successfully.")
                    } else {
                        compiledJs = ""
                        val errors = result.optJSONArray("errors")
                        val message = if (errors == null || errors.length() == 0) "Compilation failed." else
                            (0 until errors.length()).joinToString("\n") { errors.optString(it) }
                        outputView.text = message
                        setStatus(message)
                    }
                } catch (e: Exception) {
                    setStatus("Compiler response error: ${e.message}")
                }
            }
        }
    }

    private fun refreshManifest() {
        if (!::manifestField.isInitialized) return
        val manifest = JSONObject()
            .put("format", 1)
            .put("id", idField.text.toString().trim())
            .put("name", nameField.text.toString().trim())
            .put("description", descriptionField.text.toString().trim())
            .put("author", authorField.text.toString().trim())
            .put("version", versionField.text.toString().trim())
            .put("dependencies", JSONObject().put("valenced.api", JSONObject().put("version", ">=1 <2")).put("discord", JSONObject().put("version", "*")))
            .put("dist", JSONObject().put("script", "index.js"))
        manifestField.setText(manifest.toString(2))
    }

    private fun validateManifest(): Boolean {
        return try {
            val m = JSONObject(manifestField.text.toString())
            require(m.optString("id").matches(Regex("^[a-z0-9]+([.-][a-z0-9]+)*$"))) { "Plugin ID is missing or invalid." }
            require(m.optString("name").isNotBlank()) { "Plugin name is required." }
            require(m.optString("version").isNotBlank()) { "Plugin version is required." }
            require(m.optJSONObject("dist")?.optString("script") == "index.js") { "dist.script must be index.js." }
            setStatus("Manifest is valid.")
            true
        } catch (e: Exception) {
            setStatus("Manifest error: ${e.message}")
            false
        }
    }

    private fun saveDraft() {
        getSharedPreferences("plugin_studio", MODE_PRIVATE).edit()
            .putString("name", nameField.text.toString())
            .putString("id", idField.text.toString())
            .putString("author", authorField.text.toString())
            .putString("version", versionField.text.toString())
            .putString("description", descriptionField.text.toString())
            .putString("code", codeField.text.toString())
            .putString("manifest", manifestField.text.toString())
            .apply()
        setStatus("Draft saved on this device.")
    }

    private fun loadDraft(showMessage: Boolean) {
        val p = getSharedPreferences("plugin_studio", MODE_PRIVATE)
        if (!p.contains("code") || !::codeField.isInitialized) return
        nameField.setText(p.getString("name", "My First Plugin"))
        idField.setText(p.getString("id", "niche.my-first-plugin"))
        authorField.setText(p.getString("author", "Plugin Developer"))
        versionField.setText(p.getString("version", "1.0.0"))
        descriptionField.setText(p.getString("description", "A custom Valenced plugin."))
        codeField.setText(p.getString("code", helloTemplate))
        if (::manifestField.isInitialized) manifestField.setText(p.getString("manifest", "{}"))
        if (showMessage) setStatus("Draft loaded.")
    }

    private fun exportZip() {
        if (compiledJs.isBlank()) {
            setStatus("Compile your TypeScript source successfully before exporting.")
            return
        }
        if (!validateManifest()) return
        val id = idField.text.toString().trim()
        pendingZip = makeZip(
            linkedMapOf(
                "$id/manifest.json" to manifestField.text.toString(),
                "$id/src/index.ts" to codeField.text.toString(),
                "$id/index.js" to compiledJs,
                "$id/README.txt" to "Created with Valenced Plugin Studio. TypeScript is transpiled but external imports are not bundled. Run the Valenced CLI build before installing plugins with external dependencies."
            )
        )
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/zip"
            putExtra(Intent.EXTRA_TITLE, "$id.zip")
        }
        startActivityForResult(intent, 7001)
    }

    private fun makeZip(files: Map<String, String>): ByteArray {
        val bytes = ByteArrayOutputStream()
        ZipOutputStream(bytes).use { zip ->
            files.forEach { (path, content) ->
                zip.putNextEntry(ZipEntry(path))
                zip.write(content.toByteArray(Charsets.UTF_8))
                zip.closeEntry()
            }
        }
        return bytes.toByteArray()
    }

    @Deprecated("Deprecated API retained for broad device compatibility")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 7001 && resultCode == RESULT_OK && data?.data != null) {
            try {
                val bytes = pendingZip ?: error("Export data is missing.")
                contentResolver.openOutputStream(data.data!!)?.use { it.write(bytes) } ?: error("Could not open destination.")
                setStatus("Plugin ZIP exported successfully.")
            } catch (e: Exception) {
                setStatus("Export failed: ${e.message}")
            }
        }
    }

    private fun setStatus(message: String) {
        if (::statusView.isInitialized) statusView.text = message
        else Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
