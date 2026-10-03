<?php
// Temporary diagnostic page (to be removed once the hosting works).
header('Content-Type: text/plain; charset=utf-8');
ini_set('display_errors', '1');
error_reporting(E_ALL);
$root = __DIR__;
echo "php: ", PHP_VERSION, " sapi=", PHP_SAPI, "\n";
echo "root: $root writable=", var_export(is_writable($root), true), "\n";
echo "user: ", function_exists('posix_geteuid') ? posix_geteuid() : 'n/a', " owner(root)=", fileowner($root), "\n";
echo "memory_limit: ", ini_get('memory_limit'), " open_basedir: ", ini_get('open_basedir'), "\n";
echo "extensions: curl=", var_export(function_exists('curl_init'), true), " json=", var_export(function_exists('json_decode'), true), "\n";
foreach (array('config.php', 'config.sample.php', 'lib/data.php', 'data/stops.json', 'data/lines.json', 'cache') as $f) {
    $p = "$root/$f";
    echo str_pad($f, 20), file_exists($p) ? 'exists size=' . filesize($p) . ' perms=' . substr(sprintf('%o', fileperms($p)), -4) : 'MISSING', "\n";
}
echo "\n--- config.php (first 200 bytes, key masked)\n";
if (is_file("$root/config.php")) {
    echo preg_replace('/[A-Za-z0-9]{20,}/', '***', substr(file_get_contents("$root/config.php"), 0, 200)), "\n";
}
echo "\n--- require lib/data.php\n";
try {
    require "$root/lib/data.php";
    echo "ok\n";
    $c = app_config();
    echo "app_config ok, key length=", strlen($c['prim_api_key']), "\n";
    $l = load_lines();
    echo "lines: ", count($l), "\n";
} catch (Throwable $e) {
    echo get_class($e), ": ", $e->getMessage(), " @ ", $e->getFile(), ":", $e->getLine(), "\n";
}
