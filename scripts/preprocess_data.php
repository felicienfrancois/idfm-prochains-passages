<?php
/**
 * Build data/stops.json and data/lines.json from the IDFM "Arrêts et lignes associées" CSV.
 *
 * Usage: php scripts/preprocess_data.php [path/to/arrets-lignes.csv]
 * Source: https://prim.iledefrance-mobilites.fr/jeux-de-donnees/arrets-lignes
 */

require __DIR__ . '/../lib/data.php';

$csvPath = isset($argv[1]) ? $argv[1] : APP_ROOT . '/arrets-lignes.csv';
if (!is_file($csvPath)) {
    fwrite(STDERR, "CSV file not found: $csvPath\n");
    exit(1);
}

// Some stop ids from the CSV do not match the id expected by the stop-monitoring API.
// Known manual fixes: CSV id => monitoring id.
$overrides = json_decode(file_get_contents(APP_ROOT . '/data/stop_id_overrides.json'), true);
if (!is_array($overrides)) {
    $overrides = array();
}

$fh = fopen($csvPath, 'r');
if (!$fh) {
    fwrite(STDERR, "Cannot open $csvPath\n");
    exit(1);
}

$header = fgetcsv($fh, 0, ';');
if (!$header) {
    fwrite(STDERR, "Empty CSV\n");
    exit(1);
}
// Strip UTF-8 BOM from the first column name
$header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
$col = array_flip($header);
foreach (array('id', 'route_long_name', 'stop_id', 'stop_name', 'nom_commune') as $required) {
    if (!isset($col[$required])) {
        fwrite(STDERR, "Missing CSV column: $required\n");
        exit(1);
    }
}

$stops = array();
$lines = array();
$rowCount = 0;
while (($row = fgetcsv($fh, 0, ';')) !== false) {
    if (count($row) < count($header)) {
        continue;
    }
    $rowCount++;
    $stopIdParts = explode(':', $row[$col['stop_id']]);
    $stopId = end($stopIdParts);
    if (isset($overrides[$stopId])) {
        $stopId = $overrides[$stopId];
    }
    $lineIdParts = explode(':', $row[$col['id']]);
    $lineId = end($lineIdParts);
    $stopName = $row[$col['stop_name']];

    if (!isset($stops[$stopId])) {
        $stops[$stopId] = array(
            $stopName,
            $row[$col['nom_commune']],
            array(),
            normalize_search($stopName),
        );
    }
    if (!in_array($lineId, $stops[$stopId][2], true)) {
        $stops[$stopId][2][] = $lineId;
        sort($stops[$stopId][2]);
    }
    if (!isset($lines[$lineId])) {
        $lines[$lineId] = $row[$col['route_long_name']];
    }
}
fclose($fh);

ksort($stops, SORT_NATURAL);
ksort($lines, SORT_NATURAL);

$flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
file_put_contents(APP_ROOT . '/data/stops.json', json_encode($stops, $flags));
file_put_contents(APP_ROOT . '/data/lines.json', json_encode($lines, $flags));

echo "Loaded $rowCount CSV rows\n";
echo 'Written ' . count($stops) . ' stops and ' . count($lines) . " lines to data/\n";
