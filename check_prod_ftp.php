<?php
$ftp_server = 'ftp.fusionteamvolley.it';
$ftp_user = '12639683@aruba.it';
$ftp_pass = 'pJd1L3kPXaICJ!';

$conn_id = ftp_connect($ftp_server) or die("Could not connect to $ftp_server");
if (@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
    ftp_pasv($conn_id, true);
    echo "Connected as $ftp_user@$ftp_server\n";

    echo "Listing root dir:\n";
    $files = ftp_nlist($conn_id, '.');
    print_r($files);
    
    echo "Listing ERP/cron dir:\n";
    $files = ftp_nlist($conn_id, 'www.fusionteamvolley.it/ERP/cron');
    print_r($files);

    echo "Listing ERP/uploads/backups dir:\n";
    $backups = ftp_nlist($conn_id, 'www.fusionteamvolley.it/ERP/uploads/backups');
    print_r($backups);

} else {
    echo "Could not connect as $ftp_user\n";
}
ftp_close($conn_id);
