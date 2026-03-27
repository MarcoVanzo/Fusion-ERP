const https = require('https');
https.get('https://www.fusionteamvolley.it/ERP/api/router.php?module=outseason&action=getEntries&season_key=2026', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    let m = JSON.parse(data);
    let e = m.data.entries;
    console.log("Original first 3:", e.slice(0,3).map(x => x.entry_date || x.EntryDate || 'MISSING'));
    const n=[...e].sort((n,t)=>{
      const d1=new Date(n.entry_date||n.EntryDate||0).getTime();
      const d2=new Date(t.entry_date||t.EntryDate||0).getTime();
      return d2-d1;
    });
    console.log("Sorted first 3:", n.slice(0,3).map(x => x.entry_date || x.EntryDate || 'MISSING'));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
