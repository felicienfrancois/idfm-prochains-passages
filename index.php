<?php
/**
 * Main page.
 *   /                      -> settings dialog opened (search stops)
 *   /<stopIds>?limit=12    -> next departures board (rewritten to index.php?stops=<stopIds>)
 *   /?stops=["id","id"]    -> legacy JSON format, redirected to /<id>,<id>
 *   /?standalone=1         -> PWA entry point: restores the last board from localStorage (JS)
 */

require __DIR__ . '/lib/data.php';

$config = app_config();
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');

$stopsParam = isset($_GET['stops']) ? trim((string) $_GET['stops']) : '';
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 0;

// Legacy format: ?stops=["id1","id2"]
if ($stopsParam !== '' && $stopsParam[0] === '[') {
    $decoded = json_decode($stopsParam, true);
    if (is_array($decoded) && count($decoded)) {
        $target = $base . '/' . implode(',', array_map('strval', $decoded));
        if ($limit > 0) {
            $target .= '?limit=' . $limit;
        }
        header('Location: ' . $target, true, 302);
        exit;
    }
    $stopsParam = '';
}

$stopIdConfigs = split_stop_configs($stopsParam);
$stops = resolve_stops($stopIdConfigs);
$standalone = !empty($_GET['standalone']);
$hasStops = count($stopIdConfigs) > 0;

$allLines = array();
foreach ($stops as $stop) {
    foreach ($stop['lines'] as $line) {
        $allLines[] = $line;
    }
}
$title = count($stops) ? $stops[0]['name'] . ' - Prochains passages' : 'Prochains passages - Ile de France';
$description = count($stops)
    ? 'Prochains passages des lignes ' . implode(', ', array_unique($allLines))
    : "Composez votre écran de suivi des prochains passages de votre Bus, Métro, Tram, Rer d'île de France";

$appState = array(
    'base' => $base,
    'stopIds' => $stopIdConfigs,
    'limit' => $limit,
    'standalone' => $standalone,
);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo e($title); ?></title>
<meta name="description" content="<?php echo e($description); ?>">
<meta name="theme-color" content="#57534e">
<link rel="shortcut icon" type="image/png" href="<?php echo e($base); ?>/icon.png">
<link rel="apple-touch-icon" href="<?php echo e($base); ?>/icon.png">
<link rel="manifest" href="<?php echo e($base); ?>/manifest.json">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tauri&display=swap">
<link rel="stylesheet" href="<?php echo e($base); ?>/assets/app.css?v=1">
<link rel="stylesheet" href="<?php echo e($base); ?>/assets/lines.css?v=1">
</head>
<body>

<div id="loading" class="overlay overlay--page<?php echo $hasStops ? '' : ' hidden'; ?>">
  <div class="spinner"></div>
</div>

<div id="board"></div>

<button id="settings-button" class="settings-button settings-button--hidden" type="button" title="Modifier les arrêts">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="40" height="40">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
  </svg>
</button>

<div id="settings" class="settings<?php echo $hasStops ? ' settings--hidden' : ''; ?>">
  <div class="settings__header">
    <input id="search" type="text" class="settings__search" autocomplete="off"
           placeholder="Rechercher un arrêt de Bus, Métro, RER ou Transilien">
    <button id="settings-close" class="settings__close" type="button" title="Fermer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="32" height="32">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  <div class="settings__body">
    <div id="search-help" class="settings__help">
      <div class="settings__help-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="32" height="32">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </div>
      <div class="settings__help-text">
        Recherchez vos arrêts de Bus, Métro, Tram, Rer d'île de France,
        pour les ajouter à votre tableau de suivi des prochains passages.
      </div>
    </div>
    <div id="search-loading" class="overlay overlay--search hidden">
      <div class="spinner spinner--small"></div>
    </div>
    <table id="search-results" class="results"></table>
  </div>
  <div class="settings__footer">
    <button id="settings-validate" class="settings__validate" type="button" disabled>Valider</button>
  </div>
</div>

<div class="footer">
  <div class="footer__right">
    <span class="footer__item" id="footer-size"></span>
    <span>•</span>
    <span class="footer__item" id="footer-load"></span>
    <span>•</span>
    <span class="footer__item" id="footer-refresh"></span>
    <span>•</span>
    <span class="footer__item" id="footer-now"></span>
  </div>
  <div class="footer__left">
    <span class="footer__item">© <span id="footer-year"><?php echo date('Y'); ?></span> <span class="hide-sm">Félicien François</span></span>
    <span>•</span>
    <a href="https://prochains-passages.fr" class="footer__item">prochains-passages.fr</a>
    <span class="hide-lg">•</span>
    <a href="https://github.com/felicienfrancois/idfm-prochains-passages" class="footer__item hide-lg">Code source</a>
    <span>•</span>
    <span class="footer__item">
      <span class="hide-lg">Données fournies par l'</span><a href="https://prim.iledefrance-mobilites.fr">API <span class="hide-sm">Ile de France</span><span class="show-sm">IDF</span> Mobilité</a>
    </span>
  </div>
</div>

<script>window.APP = <?php echo json_encode($appState, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP); ?>;</script>
<script src="<?php echo e($base); ?>/assets/app.js?v=1"></script>
</body>
</html>
