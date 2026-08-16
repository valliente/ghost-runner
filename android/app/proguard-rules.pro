# ProGuard rules for Ghost Runner (Capacitor Android)

-keep public class * extends com.getcapacitor.Plugin
-keep public class * extends com.getcapacitor.BridgeActivity
-keep class com.getcapacitor.** { *; }

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-dontwarn com.getcapacitor.**

# Tone.js / Audio / WebView optimizations
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
    public *;
}
