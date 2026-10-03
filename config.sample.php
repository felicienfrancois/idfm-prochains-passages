<?php
/**
 * Default configuration. Copy this file to config.php and fill in your values.
 * config.php is gitignored. The environment variable PRIM_API_KEY also overrides the key.
 */
return array(
    // Ile de France Mobilités API key: https://prim.iledefrance-mobilites.fr
    'prim_api_key' => '',
    // Public URL of the site (used for meta tags)
    'site_url' => 'https://prochains-passages.fr',
    // Seconds during which a stop-monitoring response is reused across clients (0 disables the cache)
    'cache_ttl' => 20,
    // Directory used for the response cache (must be writable; silently disabled otherwise)
    'cache_dir' => __DIR__ . '/cache',
);
