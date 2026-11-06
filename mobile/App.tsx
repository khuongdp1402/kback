import { useRef, useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";
import Constants from "expo-constants";

// The KBack web app — this native shell is a thin WebView wrapper around it, so every
// feature (auth, shops, wallet, admin, Telegram linking) works identically to the browser
// version with zero duplicated UI/API code. Override via app.json "extra.kbackUrl" for local
// dev against a tunneled dev server; defaults to production.
const KBACK_URL: string =
  (Constants.expoConfig?.extra?.kbackUrl as string | undefined) ??
  "https://kback-app.vercel.app";

// Hosts that should open inside the WebView (KBack itself, its auth flow, and AccessTrade's
// tracking domains so "Mua ngay" redirects land the user on the real merchant page without
// leaving the app). Everything else (the merchant sites themselves, e.g. shopee.vn) opens in
// the system browser — buying on Shopee/Tiki should use their real app/site experience, not be
// trapped inside KBack's WebView.
const IN_APP_HOSTS = [
  "kback-app.vercel.app",
  "vercel.app", // preview deployments during dev
  "go.isclix.com", // AccessTrade deep link redirect chain
  "shorten.asia", // AccessTrade short links
  "click.accesstrade.vn",
];

function isInAppHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return IN_APP_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleNavigationStateChange = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    if (isInAppHost(request.url)) return true;
    // Real merchant URL (Shopee, Tiki, TikTok Shop, ...) — hand off to the system browser/app
    // so the user gets the merchant's own app if installed, and so KBack's WebView never has
    // to render a third-party checkout flow.
    void Linking.openURL(request.url);
    return false;
  }, []);

  // Android hardware back button navigates the WebView's own history first, and only lets the
  // app close once there's nothing left to go back to.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webviewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <WebView
            ref={webviewRef}
            source={{ uri: KBACK_URL }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            pullToRefreshEnabled
            allowsBackForwardNavigationGestures
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            startInLoadingState={false}
            decelerationRate="normal"
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#a97318" />
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fbf8f2", // matches KBack's --background token (light theme)
  },
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "#fbf8f2",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fbf8f2",
    alignItems: "center",
    justifyContent: "center",
  },
});
