package it.matteonaif.kokufin;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin locali: vanno registrati prima di super.onCreate
        registerPlugin(SaveFilePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
