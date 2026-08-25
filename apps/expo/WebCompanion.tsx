import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";

const configuredUrl = process.env.EXPO_PUBLIC_SHOWOUT_URL?.trim();
const simulatorFallback = Platform.select({
  android: "http://10.0.2.2:3000",
  ios: "http://localhost:3000",
  default: "http://localhost:3000",
});

export default function App() {
  const webView = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const appUrl = useMemo(() => configuredUrl || simulatorFallback, []);

  const reload = useCallback(() => {
    setFailed(false);
    setLoading(true);
    webView.current?.reload();
  }, []);

  const onNavigation = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.utilityBar}>
        <Text style={styles.wordmark}>SHOWOUT<Text style={styles.red}>■</Text></Text>
        <View style={styles.actions}>
          {canGoBack && (
            <Pressable accessibilityRole="button" onPress={() => webView.current?.goBack()} style={styles.utilityButton}>
              <Text style={styles.utilityText}>BACK</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Reload SHOWOUT" onPress={reload} style={styles.utilityButton}>
            <Text style={styles.utilityText}>RELOAD</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.webContainer}>
        <WebView
          ref={webView}
          source={{ uri: appUrl }}
          originWhitelist={["http://*", "https://*"]}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          setSupportMultipleWindows={false}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={onNavigation}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
          style={styles.webView}
        />

        {loading && !failed && (
          <View style={styles.overlay} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color="#ff3b1f" />
            <Text style={styles.kicker}>SETTING THE STAGE</Text>
          </View>
        )}

        {failed && (
          <View style={styles.overlay} accessibilityLiveRegion="assertive">
            <Text style={styles.errorNumber}>OFF AIR.</Text>
            <Text style={styles.errorCopy}>Could not reach {appUrl}</Text>
            <Text style={styles.help}>
              Start Next.js on your computer, keep both devices on the same Wi-Fi, and set EXPO_PUBLIC_SHOWOUT_URL to your computer&apos;s LAN address.
            </Text>
            <Pressable accessibilityRole="button" onPress={reload} style={styles.retryButton}>
              <Text style={styles.retryText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f0e7" },
  utilityBar: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderBottomColor: "#121212",
    borderBottomWidth: 1.5,
    backgroundColor: "#f4f0e7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wordmark: { color: "#121212", fontSize: 18, fontWeight: "900", letterSpacing: -0.8 },
  red: { color: "#ff3b1f", fontSize: 11 },
  actions: { flexDirection: "row", gap: 8 },
  utilityButton: { minHeight: 38, justifyContent: "center", paddingHorizontal: 8, borderColor: "#121212", borderWidth: 1 },
  utilityText: { color: "#121212", fontWeight: "800", fontSize: 10, letterSpacing: 0.8 },
  webContainer: { flex: 1, backgroundColor: "#f4f0e7" },
  webView: { flex: 1, backgroundColor: "#f4f0e7" },
  overlay: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    paddingHorizontal: 28,
    backgroundColor: "#f4f0e7",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: { marginTop: 18, color: "#121212", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  errorNumber: { color: "#121212", fontWeight: "900", fontSize: 48, letterSpacing: -2 },
  errorCopy: { marginTop: 8, color: "#121212", fontWeight: "800", textAlign: "center" },
  help: { marginTop: 14, color: "#69665f", fontSize: 13, lineHeight: 19, textAlign: "center" },
  retryButton: { marginTop: 22, minHeight: 48, paddingHorizontal: 24, justifyContent: "center", backgroundColor: "#ff3b1f", borderColor: "#121212", borderWidth: 1.5 },
  retryText: { color: "#121212", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
});
