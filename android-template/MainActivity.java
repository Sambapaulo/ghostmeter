package app.ghostmeter.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private boolean doubleBackToExitPressedOnce = false;
    private static final int TIME_INTERVAL = 2000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new WebAppInterface(), "AndroidApp");
        }
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();

        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            if (doubleBackToExitPressedOnce) {
                finishAffinity();
                return;
            }

            this.doubleBackToExitPressedOnce = true;
            Toast.makeText(this, "Appuyez encore une fois pour quitter", Toast.LENGTH_SHORT).show();

            new android.os.Handler().postDelayed(() -> {
                doubleBackToExitPressedOnce = false;
            }, TIME_INTERVAL);
        }
    }

    public class WebAppInterface {
        @android.webkit.JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                finishAffinity();
            });
        }

        @android.webkit.JavascriptInterface
        public boolean canGoBack() {
            WebView webView = getBridge().getWebView();
            return webView != null && webView.canGoBack();
        }

        @android.webkit.JavascriptInterface
        public void goBack() {
            runOnUiThread(() -> {
                WebView webView = getBridge().getWebView();
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                }
            });
        }
    }
}
