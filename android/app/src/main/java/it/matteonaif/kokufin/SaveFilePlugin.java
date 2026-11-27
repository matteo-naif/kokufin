package it.matteonaif.kokufin;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Finestra di sistema "Salva con nome" (Storage Access Framework): l'utente sceglie la cartella
 * e il testo ricevuto viene scritto nel file. Non servono permessi di memoria.
 */
@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name");
        if (name == null || call.getString("data") == null) {
            call.reject("name e data sono obbligatori");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, name);
        startActivityForResult(call, intent, "onDocumentCreated");
    }

    @ActivityCallback
    private void onDocumentCreated(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            // Finestra chiusa senza salvare
            resolveSaved(call, false);
            return;
        }
        Uri uri = data.getData();
        try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
            if (out == null) throw new IOException("Impossibile aprire " + uri);
            out.write(call.getString("data").getBytes(StandardCharsets.UTF_8));
            resolveSaved(call, true);
        } catch (IOException e) {
            call.reject("Scrittura del file non riuscita", e);
        }
    }

    private void resolveSaved(PluginCall call, boolean saved) {
        JSObject ret = new JSObject();
        ret.put("saved", saved);
        call.resolve(ret);
    }
}
