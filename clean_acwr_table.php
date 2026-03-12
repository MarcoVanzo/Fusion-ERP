<?php
$f = 'js/modules/athletes.js';
$c = file_get_contents($f);

// Remove the TH
$c = str_replace('<th>ACWR</th>', '', $c);

// Remove the TD line
$c = preg_replace('/<td>.*?acwr_score \? Utils\.riskBadge.*?<\/td>\n/s', '', $c);

file_put_contents($f, $c);
echo "Cleaned table vars.\n";
