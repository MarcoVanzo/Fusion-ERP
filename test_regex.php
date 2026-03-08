<?php
$summaryText = "80,00 € Paid";

// Current code
function currentParse($summaryText) {
    if (preg_match_all('/[€$£]\s*([\d.,]+)|([\d.,]+)\s*[€$£]/', $summaryText, $tm2)) {
        $lastMatch = end($tm2[1]) ?: end($tm2[2]);
        var_dump("Current match:", $lastMatch);
    } else {
        var_dump("Current match: NONE");
    }
}

// Proposed code
function newParse($summaryText) {
    // Add /u for UTF-8 and treat non-breaking spaces
    if (preg_match_all('/(?:[€\$£]|&euro;)\s*([\d.,]+)|([\d.,]+)\s*(?:[€\$£]|&euro;)/ui', $summaryText, $tm2)) {
        // filter out empty
        $a1 = array_filter($tm2[1]);
        $a2 = array_filter($tm2[2]);
        $lastMatch = !empty($a1) ? end($a1) : (!empty($a2) ? end($a2) : null);
        var_dump("New match:", $lastMatch);
    } else {
        var_dump("New match: NONE");
    }
}
currentParse($summaryText);
newParse($summaryText);

// Plus, lets see if we can just parse it directly since it's "80,00 € Paid"
if (preg_match('/^([\d.,]+)\s*(?:[€\$£]|&euro;)/ui', $summaryText, $m)) {
    var_dump("Direct match:", $m[1]);
}
