<?php
$f = 'js/modules/athletes.js';
$c = file_get_contents($f);
$p = '/\s*\\\\x3c!-- ACWR Section --\\\\x3e.*?Athlete Load — ACWR.*?<\!\\-\\- AI Summary section \\-\\-([^>]*|)>/s';
// Wait, the next section is: \x3c!-- AI Summary section --\x3e
$p = '/\s*\\\\x3c!-- ACWR Section --\\\\x3e.*?\\\\x3c!-- AI Summary section --\\\\x3e/s';

$n = preg_replace($p, "\n            \\x3c!-- AI Summary section --\\x3e", $c);
if ($n !== $c) {
    file_put_contents($f, $n);
    echo "Replaced successfully.";
} else {
    echo "Pattern not found.";
}
