<?php
/**
 * GET /api/stops/search?search=<text>
 *
 * Full text search over stop names. Returns matching stops sorted by relevance
 * (score 1 = whole words match, higher = partial word match).
 */

require __DIR__ . '/../lib/data.php';

$search = isset($_GET['search']) ? (string) $_GET['search'] : '';
$needle = normalize_search($search);
if (strlen($needle) < 3) {
    json_response(array());
}

$stops = load_stops();
$lines = load_lines();
$results = array();
foreach ($stops as $stopId => $row) {
    $pos = strpos($row[3], $needle);
    if ($pos === false) {
        continue;
    }
    $prev = $pos > 0 ? $row[3][$pos - 1] : '';
    $end = $pos + strlen($needle);
    $next = $end < strlen($row[3]) ? $row[3][$end] : '';
    // 1 when the match is delimited by word boundaries on both sides, up to 3 when inside a word
    $score = 1 + ($prev !== '' && $prev !== ' ' ? 1 : 0) + ($next !== '' && $next !== ' ' ? 1 : 0);
    $results[] = array(
        'id' => (string) $stopId,
        'name' => $row[0],
        'city' => $row[1],
        'line_ids' => $row[2],
        'lines' => array_values(array_filter(array_map(function ($id) use ($lines) {
            return isset($lines[$id]) ? $lines[$id] : null;
        }, $row[2]))),
        'score' => $score,
    );
    if (count($results) >= 500) {
        break;
    }
}

// Stable sort (PHP >= 8.0) by relevance only, keeping the database order otherwise
usort($results, function ($a, $b) {
    return $a['score'] - $b['score'];
});

json_response($results);
