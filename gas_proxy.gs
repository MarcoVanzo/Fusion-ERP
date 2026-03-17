/**
 * Fusion ERP - FIPAV Proxy
 * 
 * Questo script agisce come un proxy per scaricare le pagine di FIPAV Veneto 
 * ed evitare il blocco IP effettuato dai loro server verso i datacenter (es. Aruba).
 * 
 * ISTRUZIONI PER L'USO:
 * 1. Vai su https://script.google.com/ e crea un nuovo progetto
 * 2. Incolla questo codice nel file Codice.gs
 * 3. Clicca su "Esegui" e concedi i permessi (delineerà il tuo account)
 * 4. In alto, clicca "Esegui il deployment" -> "Nuovo deployment"
 * 5. Tipo: "App Web"
 * 6. Accesso: "Chiunque"
 * 7. Copia l'URL dell'applicazione web
 * 8. Nel file `.env` e `.env.prod` dell'ERP, aggiungi o modifica questa riga:
 *    GAS_PROXY_URL=https://script.google.com/macros/s/.../exec
 */

function doGet(e) {
  var url = e.parameter.url;
  if (!url) {
    return ContentService.createTextOutput("Manca il parametro 'url'")
                         .setMimeType(ContentService.MimeType.TEXT);
  }
  
  try {
    var options = {
      'method': 'get',
      'muteHttpExceptions': true,
      'headers': {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    };
    
    var response = UrlFetchApp.fetch(url, options);
    
    // Controlla se il server ha bloccato anche Google (raro ma possibile)
    if (response.getResponseCode() >= 400) {
      return ContentService.createTextOutput("Errore " + response.getResponseCode() + " dal server remoto:\n\n" + response.getContentText())
                           .setMimeType(ContentService.MimeType.TEXT);
    }
    
    return ContentService.createTextOutput(response.getContentText())
                         .setMimeType(ContentService.MimeType.HTML);
                         
  } catch(err) {
    return ContentService.createTextOutput("Errore nel proxy: " + err.toString())
                         .setMimeType(ContentService.MimeType.TEXT);
  }
}
