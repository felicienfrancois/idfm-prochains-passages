<?php
/**
 * GET /api/next_departures?stopIds=<id>[{<lineId>,...}],<id>...&limit=<n>
 *
 * Returns, for each requested stop, the stop description plus its next departures
 * fetched from the IDFM PRIM stop-monitoring API.
 */

require __DIR__ . '/../lib/data.php';

$stopIdsParam = isset($_GET['stopIds']) ? trim((string) $_GET['stopIds']) : '';
if ($stopIdsParam === '') {
    json_response(array('error' => 'Missing stopIds parameter'), 400);
}
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 0;

$config = app_config();
$lines = load_lines();
$now = time();

$result = array();
foreach (resolve_stops(split_stop_configs($stopIdsParam)) as $stop) {
    $allowed = $stop['allowed_lines'];
    $entry = array(
        'id' => $stop['id'],
        'name' => $stop['name'],
        'lines' => $stop['lines'],
        'next_departures' => array(),
        'error' => null,
    );

    $siri = fetch_stop_monitoring($stop['id'], $config);
    if ($siri === null) {
        $entry['error'] = 'Données indisponibles';
        $result[] = $entry;
        continue;
    }

    $visits = array();
    if (isset($siri['Siri']['ServiceDelivery']['StopMonitoringDelivery']) && is_array($siri['Siri']['ServiceDelivery']['StopMonitoringDelivery'])) {
        foreach ($siri['Siri']['ServiceDelivery']['StopMonitoringDelivery'] as $delivery) {
            if (isset($delivery['MonitoredStopVisit']) && is_array($delivery['MonitoredStopVisit'])) {
                foreach ($delivery['MonitoredStopVisit'] as $visit) {
                    $visits[] = $visit;
                }
            }
        }
    }

    foreach ($visits as $visit) {
        $journey = isset($visit['MonitoredVehicleJourney']) ? $visit['MonitoredVehicleJourney'] : array();
        $call = isset($journey['MonitoredCall']) ? $journey['MonitoredCall'] : array();

        $lineId = extract_line_id(siri_value($journey, 'LineRef'));
        if ($allowed !== null && !in_array($lineId, $allowed, true)) {
            continue;
        }

        $expectedDeparture = isset($call['ExpectedDepartureTime']) ? $call['ExpectedDepartureTime'] : null;
        $aimedDeparture = isset($call['AimedDepartureTime']) ? $call['AimedDepartureTime'] : null;
        $departureTs = parse_ts($expectedDeparture ? $expectedDeparture : $aimedDeparture);
        if ($departureTs === null || $departureTs < $now - 60) {
            continue;
        }

        $entry['next_departures'][] = array(
            'item_id' => isset($visit['ItemIdentifier']) ? $visit['ItemIdentifier'] : null,
            'direction_name' => strip_gare(siri_text($journey, 'DirectionName')),
            'destination_name' => strip_gare(siri_text($journey, 'DestinationName')),
            'destination_display' => strip_gare(siri_text($call, 'DestinationDisplay')),
            'journey_note' => siri_text($journey, 'JourneyNote'),
            'line' => isset($lines[$lineId]) ? $lines[$lineId] : null,
            'stop_point_name' => siri_text($call, 'StopPointName'),
            'vehicle_at_stop' => !empty($call['VehicleAtStop']),
            'arrival_platform_name' => siri_value($call, 'ArrivalPlatformName'),
            'departure_status' => isset($call['DepartureStatus']) ? $call['DepartureStatus'] : null,
            'arrival_status' => isset($call['ArrivalStatus']) ? $call['ArrivalStatus'] : null,
            'expected_departure_time' => $expectedDeparture,
            'aimed_departure_time' => $aimedDeparture,
            // Pre-computed for the browser (no Date parsing / Intl needed client side)
            'departure_ts' => $departureTs,
            'departure_hm' => format_hm($departureTs),
            'aimed_departure_hm' => format_hm(parse_ts($aimedDeparture)),
        );
    }

    usort($entry['next_departures'], function ($a, $b) {
        return $a['departure_ts'] - $b['departure_ts'];
    });
    if ($limit > 0 && count($entry['next_departures']) > $limit) {
        $entry['next_departures'] = array_slice($entry['next_departures'], 0, $limit);
    }
    $result[] = $entry;
}

json_response(array(
    'server_time' => $now,
    'stops' => $result,
));

// ---------------------------------------------------------------------------

/** Call PRIM stop-monitoring, with a short shared file cache. Returns decoded JSON or null on failure. */
function fetch_stop_monitoring($stopId, $config)
{
    $cacheFile = null;
    $ttl = isset($config['cache_ttl']) ? (int) $config['cache_ttl'] : 0;
    if ($ttl > 0 && !empty($config['cache_dir'])) {
        $dir = $config['cache_dir'];
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        if (is_dir($dir) && is_writable($dir)) {
            $cacheFile = $dir . '/stop_' . preg_replace('/[^A-Za-z0-9_-]/', '', $stopId) . '.json';
            if (is_file($cacheFile) && filemtime($cacheFile) > time() - $ttl) {
                $cached = json_decode(file_get_contents($cacheFile), true);
                if (is_array($cached)) {
                    return $cached;
                }
            }
        }
    }

    $url = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=' .
        rawurlencode('STIF:StopPoint:Q:' . $stopId . ':');
    $body = http_get($url, array('apiKey: ' . $config['prim_api_key'], 'Accept: application/json'));
    if ($body === null) {
        return null;
    }
    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        return null;
    }
    if ($cacheFile) {
        @file_put_contents($cacheFile, $body, LOCK_EX);
    }
    return $decoded;
}

/** HTTP GET with cURL, falling back to file_get_contents. Returns body or null. */
function http_get($url, array $headers)
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true,
        ));
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body === false || $status < 200 || $status >= 300) {
            return null;
        }
        return $body;
    }
    $context = stream_context_create(array(
        'http' => array(
            'method' => 'GET',
            'header' => implode("\r\n", $headers),
            'timeout' => 10,
            'ignore_errors' => true,
        ),
    ));
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        return null;
    }
    if (isset($http_response_header[0]) && !preg_match('/ 2\d\d /', $http_response_header[0])) {
        return null;
    }
    return $body;
}

/** SIRI "value" field of a key: {"value": "..."} */
function siri_value($node, $key)
{
    if (!isset($node[$key])) {
        return null;
    }
    $v = $node[$key];
    if (is_array($v)) {
        return isset($v['value']) ? $v['value'] : null;
    }
    return $v;
}

/** SIRI localized text: [{"value": "..."}] (first entry) */
function siri_text($node, $key)
{
    if (!isset($node[$key])) {
        return null;
    }
    $v = $node[$key];
    if (is_array($v)) {
        if (isset($v['value'])) {
            return $v['value'];
        }
        if (isset($v[0])) {
            return is_array($v[0]) ? (isset($v[0]['value']) ? $v[0]['value'] : null) : $v[0];
        }
        return null;
    }
    return $v;
}

/** "STIF:Line::C01727:" => "C01727" */
function extract_line_id($lineRef)
{
    if (!$lineRef) {
        return null;
    }
    $parts = explode(':', $lineRef);
    // second to last element (last is empty because of the trailing colon)
    return count($parts) >= 2 ? $parts[count($parts) - 2] : null;
}

function strip_gare($text)
{
    return $text === null ? null : str_replace('Gare de ', '', $text);
}

/** ISO 8601 date => unix timestamp (seconds), or null */
function parse_ts($iso)
{
    if (!$iso) {
        return null;
    }
    $ts = strtotime($iso);
    return $ts === false ? null : $ts;
}

/** unix timestamp => "HH:MM" in Paris time */
function format_hm($ts)
{
    if ($ts === null) {
        return null;
    }
    $d = new DateTime('@' . $ts);
    $d->setTimezone(new DateTimeZone('Europe/Paris'));
    return $d->format('H:i');
}
