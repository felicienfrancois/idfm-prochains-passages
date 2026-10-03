# idfm-prochains-passages

Display the next bus, trains, metros, tramways at any station in the Paris area (Ile de France Mobilité).

Published at [prochains-passages.fr](https://prochains-passages.fr)

Uses [Ile de France Mobilités APIs](https://prim.iledefrance-mobilites.fr)

## Stack

This branch is a dependency-free rewrite designed for cheap shared hosting (OVH free / "Start" plans)
and for old kiosk browsers (Raspberry Pi WebViews):

- **Backend**: plain PHP (>= 7.0, tested on 8.2), no framework, no Composer. Only `curl` (or `allow_url_fopen`)
  and `json` are needed.
- **Frontend**: plain HTML, CSS and ES5 JavaScript. No build step, no transpiler, no polyfills.
  No `fetch`, `Promise`, flexbox, CSS variables or `Intl` so it runs on outdated WebKit/Chromium builds.
- **Data**: stops and lines are stored as JSON files in `data/` (about 3 MB), loaded on demand.

```
index.php               Main page (board + settings dialog)
api/next_departures.php GET /api/next_departures?stopIds=<id>[{<lineId>,...}],...&limit=<n>
api/search.php          GET /api/stops/search?search=<text>
lib/data.php            Config, data access and helpers
assets/app.js           Front-end logic (ES5)
assets/app.css          Styles
assets/lines.css        Official line colors
data/stops.json         { "<stopId>": [name, city, [lineId, ...], searchText] }
data/lines.json         { "<lineId>": "<short name>" }
scripts/preprocess_data.php  Builds data/*.json from the IDFM CSV
```

### URL scheme

- `/` opens the stop search dialog.
- `/<stopId>,<stopId>{<lineId>,<lineId>}?limit=12` displays the board. A `{...}` suffix restricts
  a stop to the given lines. `limit` caps the number of departures per stop.
- `/?standalone=1` (PWA start URL) restores the last board saved in `localStorage`.
- `/?stops=["id","id"]` legacy format, redirected to the new one.

## Setup

1. Copy `config.sample.php` to `config.php` and set your [PRIM API key](https://prim.iledefrance-mobilites.fr):
   ```php
   return array('prim_api_key' => 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
   ```
   The `PRIM_API_KEY` environment variable also works.
2. Make sure the `cache/` directory can be created/written by PHP (optional: stop-monitoring responses are
   shared between clients for `cache_ttl` seconds, default 20). If it is not writable the cache is skipped.

### Local development

PHP's built-in server does not read `.htaccess`, so use a router script that emulates the rewrites:

```php
<?php // router.php
$root = getcwd();
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/api/next_departures') { require $root . '/api/next_departures.php'; return true; }
if ($path === '/api/stops/search') { require $root . '/api/search.php'; return true; }
if ($path !== '/' && is_file($root . $path)) { return false; }
if (preg_match('#^/([^/]+)/?$#', $path, $m)) { $_GET['stops'] = urldecode($m[1]); }
require $root . '/index.php';
return true;
```

```bash
php -S localhost:8000 router.php
```

## Deployment on OVH shared hosting

Upload everything (except `arrets-lignes.csv`, `.git` and local `cache/`) to the web root (`www/`) via FTP.

- `.htaccess` handles the pretty URLs (`mod_rewrite`) and blocks access to `config.php`, `lib/`, `data/`, `scripts/`.
- `.ovhconfig` selects the PHP version (`app.engine.version=8.2`). Adjust it if your plan offers another version.
- Create `config.php` on the server with your API key (never commit it).
- Total footprint is about 3.5 MB, which fits the 10 MB free plan.

### Automatic deployment (GitHub Actions)

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) uploads the branch `php` to OVH over SFTP (port 22, `lftp mirror`) on every push
(or manually from the Actions tab). Configure these repository variables and secrets:

| Name | Value |
| --- | --- |
| `FTP_SERVER` (variable) | FTP host given by OVH (e.g. `ftp.cluster0xx.hosting.ovh.net`) |
| `FTP_USERNAME` (variable) | FTP user |
| `FTP_PASSWORD` | FTP password |
| `PRIM_API_KEY` | PRIM API key, written into `config.php` during the deployment |

Optional repository variable `FTP_SERVER_DIR` sets the remote directory (default `www/`).
The mirror deletes remote files that no longer exist in the repository, except the excluded paths (`cache/`, `config.sample.php`...).
OVH FTP servers do not support FTPS (`500 This security scheme is not implemented`), hence SFTP.

## Update stop points and lines databases

Stop points and lines come from the CSV ["Arrêts et lignes associées" provided by Ile de France Mobilités](https://prim.iledefrance-mobilites.fr/jeux-de-donnees/arrets-lignes).

Download the up-to-date CSV to the root of the project (`arrets-lignes.csv`), then run:

```bash
php scripts/preprocess_data.php
```

`data/stop_id_overrides.json` maps CSV stop ids to the id actually expected by the stop-monitoring API
for the few stations where they differ.
