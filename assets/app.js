/* Prochains passages - front-end.
   Plain ES5 on purpose: must run on old WebView / Chromium builds (Raspberry Pi kiosks).
   No fetch, Promise, arrow functions, let/const, template literals, classList or Intl. */
(function () {
  'use strict';

  var APP = window.APP || {};
  var BASE = APP.base || '';
  var REFRESH_INTERVAL = 60000;
  var TICK_INTERVAL = 5000;
  var IDLE_DELAY = 10000;
  var DEFAULT_LIMIT = 12;

  var state = {
    stopIds: APP.stopIds || [],
    limit: APP.limit || 0,
    stops: [],            // last API payload (array of stops with next_departures)
    serverOffset: 0,      // server time - client time (ms); the kiosk clock may drift
    loadTime: new Date(),
    lastRefreshTime: null,
    idle: true,
    idleTimer: null,
    searchTimer: null,
    searchRequest: null,
    searchItems: []
  };

  // ---------------------------------------------------------------- helpers

  function $(id) { return document.getElementById(id); }

  function hasClass(el, cls) { return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') !== -1; }
  function addClass(el, cls) { if (el && !hasClass(el, cls)) { el.className = (el.className ? el.className + ' ' : '') + cls; } }
  function removeClass(el, cls) {
    if (!el) { return; }
    el.className = (' ' + el.className + ' ').replace(' ' + cls + ' ', ' ').replace(/^\s+|\s+$/g, '');
  }
  function toggleClass(el, cls, on) { if (on) { addClass(el, cls); } else { removeClass(el, cls); } }

  function esc(text) {
    if (text === null || text === undefined) { return ''; }
    return String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function formatTimeSec(date) {
    if (!date) { return ''; }
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
  }

  /** Current time corrected with the server clock offset (ms). */
  function now() { return new Date().getTime() + state.serverOffset; }

  var ACCENTS = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a', 'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'î': 'i', 'ï': 'i', 'ô': 'o', 'ö': 'o', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ÿ': 'y',
    'À': 'A', 'Â': 'A', 'Ä': 'A', 'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Î': 'I', 'Ï': 'I', 'Ô': 'O', 'Ö': 'O', 'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'œ': 'oe', 'Œ': 'OE'
  };
  function stripAccents(text) {
    return String(text).replace(/[^\u0000-~]/g, function (c) { return ACCENTS[c] || c; });
  }

  /** CSS class used by assets/lines.css to color a line chip. */
  function lineClass(line) {
    return 'line--' + (line ? stripAccents(line).replace(/[^A-Za-z0-9-]/g, '_') : 'default');
  }

  function lineChip(line) {
    if (!line) {
      return '<img class="chip--img" src="' + esc(BASE) + '/assets/images/train.svg" alt="">';
    }
    return '<span class="chip ' + esc(lineClass(line)) + '">' + esc(line) + '</span>';
  }

  function xhrGet(url, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) { return; }
      if (xhr.status >= 200 && xhr.status < 300) {
        var data = null;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
        if (data === null) { if (onError) { onError(xhr); } return; }
        onSuccess(data);
      } else if (onError) {
        onError(xhr);
      }
    };
    xhr.send(null);
    return xhr;
  }

  function stopIdOf(config) { return config.split('{')[0]; }

  function boardPath() {
    var path = BASE + '/' + state.stopIds.join(',');
    var limit = state.limit || DEFAULT_LIMIT;
    return path + '?limit=' + limit;
  }

  function saveStopIds() {
    try { localStorage.setItem('stopIds', state.stopIds.join(',')); } catch (e) { /* storage disabled */ }
  }

  // ------------------------------------------------------------------ board

  function refresh() {
    if (!state.stopIds.length) {
      state.stops = [];
      renderBoard();
      addClass($('loading'), 'hidden');
      return;
    }
    var url = BASE + '/api/next_departures?stopIds=' + encodeURIComponent(state.stopIds.join(','));
    if (state.limit) { url += '&limit=' + encodeURIComponent(state.limit); }
    xhrGet(url, function (data) {
      if (data.server_time) {
        state.serverOffset = data.server_time * 1000 - new Date().getTime();
      }
      state.stops = data.stops || [];
      state.lastRefreshTime = new Date();
      renderBoard();
      addClass($('loading'), 'hidden');
      renderFooter();
    }, function () {
      // Keep displaying the previous data; the footer "last refresh" time shows the staleness.
      addClass($('loading'), 'hidden');
      renderBoard();
    });
  }

  function renderDeparture(dep, alt) {
    var cancelled = dep.departure_status === 'cancelled';
    var estimated = !dep.departure_status;
    var hasPlatform = !!dep.arrival_platform_name;
    var html = '<tr class="' + (alt ? 'board__row--alt' : '') + '">';

    // Departure time
    html += '<td class="board__time">';
    if (estimated && dep.aimed_departure_hm && dep.aimed_departure_hm !== dep.departure_hm) {
      html += '<div class="board__time-aimed">' + esc(dep.aimed_departure_hm) + '</div>';
    }
    html += '<div class="board__time-main' +
      (estimated ? ' board__time-main--estimated' : '') +
      (cancelled ? ' board__time-main--cancelled' : '') + '">' + esc(dep.departure_hm) + '</div>';
    html += '</td>';

    // Platform
    if (hasPlatform) {
      var colorIndex = (parseInt(dep.arrival_platform_name, 36) || 0) % 5;
      html += '<td class="board__platform">' +
        '<div class="platform__name platform--' + colorIndex + '">' + esc(dep.arrival_platform_name) + '</div>' +
        '<div class="platform__label">Voie</div></td>';
    }

    // Line
    html += '<td class="board__line">' + lineChip(dep.line) + '</td>';

    // Destination
    html += '<td class="board__destination"' + (hasPlatform ? '' : ' colspan="2"') + '>';
    html += '<div class="board__destination-name' + (dep.journey_note ? '' : ' board__destination-name--spaced') +
      (cancelled ? ' text--cancelled' : '') + '">' + esc(dep.destination_display || dep.destination_name) + '</div>';
    if (dep.journey_note) {
      html += '<div class="board__journey-note' + (cancelled ? ' text--cancelled' : '') + '">' + esc(dep.journey_note) + '</div>';
    }
    html += '</td>';

    // Status / remaining time
    html += '<td class="board__status' + (estimated ? ' board__status--estimated' : '') + (cancelled ? ' text--cancelled' : '') + '">';
    if (cancelled) {
      html += 'Annulé';
    } else if (dep.vehicle_at_stop) {
      html += 'A&nbsp;l\'arrêt';
    } else {
      var remaining = Math.round((dep.departure_ts * 1000 - now()) / 60000);
      if (remaining > 1) {
        html += '<div class="remaining' + (remaining < 5 ? ' remaining--soon' : '') + '">' +
          remaining + '<span class="remaining__unit">min</span></div>';
      } else {
        html += 'A&nbsp;l\'approche';
      }
    }
    html += '</td></tr>';
    return html;
  }

  function renderBoard() {
    var stops = state.stops;
    var html = '<table class="board">';
    var current = now();
    for (var i = 0; i < stops.length; i++) {
      var stop = stops[i];
      var sameAsPrevious = i > 0 && stops[i - 1].name === stop.name;
      var sameAsNext = i < stops.length - 1 && stops[i + 1].name === stop.name;

      html += '<thead><tr class="board__stop-header"><th colspan="5">';
      if (sameAsPrevious) {
        html += '<div class="board__stop-gap"></div>';
      } else {
        html += '<div class="board__stop-title"><span class="board__stop-name">' + esc(stop.name) + '</span>';
        for (var l = 0; l < stop.lines.length; l++) { html += lineChip(stop.lines[l]); }
        html += '</div>';
      }
      html += '</th></tr></thead><tbody>';

      var departures = stop.next_departures || [];
      var shown = 0;
      for (var d = 0; d < departures.length; d++) {
        var dep = departures[d];
        if (dep.departure_ts * 1000 < current) { continue; }
        html += renderDeparture(dep, shown % 2 === 0);
        shown++;
      }
      if (!shown) {
        if (stop.error) {
          html += '<tr><td class="board__error" colspan="5">' + esc(stop.error) + '</td></tr>';
        } else {
          html += '<tr><td class="board__empty" colspan="5">Ne circule pas</td></tr>';
        }
      }
      html += '</tbody>';
      if (!sameAsNext) {
        html += '<tbody class="board__separator"><tr><td colspan="5"></td></tr></tbody>';
      }
    }
    html += '</table>';
    $('board').innerHTML = html;
  }

  // ----------------------------------------------------------------- footer

  function renderFooter() {
    $('footer-size').innerHTML = window.innerWidth + 'x' + window.innerHeight;
    $('footer-load').innerHTML = formatTimeSec(state.loadTime);
    $('footer-refresh').innerHTML = formatTimeSec(state.lastRefreshTime);
    $('footer-now').innerHTML = formatTimeSec(new Date());
    $('footer-year').innerHTML = new Date().getFullYear();
  }

  // --------------------------------------------------------------- settings

  function settingsVisible() { return !hasClass($('settings'), 'settings--hidden'); }

  function showSettings(show) {
    toggleClass($('settings'), 'settings--hidden', !show);
    updateSettingsButton();
    if (show) {
      try { $('search').focus(); } catch (e) { /* ignore */ }
    }
  }

  function updateSettingsButton() {
    toggleClass($('settings-button'), 'settings-button--hidden', settingsVisible() || state.idle);
    toggleClass($('settings-close'), 'hidden', !state.stopIds.length);
    $('settings-validate').disabled = !state.stopIds.length;
  }

  function resetIdleTimer() {
    state.idle = false;
    updateSettingsButton();
    if (state.idleTimer) { clearTimeout(state.idleTimer); }
    state.idleTimer = setTimeout(function () {
      state.idle = true;
      updateSettingsButton();
    }, IDLE_DELAY);
  }

  function onSearchInput() {
    if (state.searchTimer) { clearTimeout(state.searchTimer); }
    state.searchTimer = setTimeout(autocomplete, 500);
  }

  function autocomplete() {
    var query = $('search').value.replace(/^\s+|\s+$/g, '');
    if (state.searchRequest) { try { state.searchRequest.abort(); } catch (e) { /* ignore */ } }
    if (query.length < 3) {
      state.searchItems = [];
      renderSearchResults();
      return;
    }
    removeClass($('search-loading'), 'hidden');
    state.searchRequest = xhrGet(BASE + '/api/stops/search?search=' + encodeURIComponent(query), function (items) {
      state.searchRequest = null;
      state.searchItems = items || [];
      addClass($('search-loading'), 'hidden');
      renderSearchResults();
    }, function (xhr) {
      state.searchRequest = null;
      addClass($('search-loading'), 'hidden');
      if (xhr.status !== 0) { // 0 = aborted by a newer search
        state.searchItems = [];
        renderSearchResults();
      }
    });
  }

  function isSelected(stopId) {
    for (var i = 0; i < state.stopIds.length; i++) {
      if (stopIdOf(state.stopIds[i]) === stopId) { return true; }
    }
    return false;
  }

  function renderSearchResults() {
    var items = state.searchItems;
    toggleClass($('search-help'), 'hidden', items.length > 0);
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var selected = isSelected(item.id);
      html += '<tr data-index="' + i + '" class="' + (item.score >= 3 ? 'results__row--score3' : item.score === 2 ? 'results__row--score2' : '') + '">';
      html += '<td class="results__check' + (selected ? '' : ' results__check--off') + '">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></td>';
      html += '<td class="results__lines">';
      for (var l = 0; l < item.lines.length; l++) { html += lineChip(item.lines[l]); }
      html += '</td>';
      html += '<td class="results__name"><div class="results__name-main">' + esc(item.name) + '</div>' +
        '<div class="results__name-city">' + esc(item.city) + '</div></td>';
      html += '</tr>';
    }
    $('search-results').innerHTML = html;
  }

  function onResultClick(event) {
    var target = event.target || event.srcElement;
    while (target && target.tagName !== 'TR') { target = target.parentNode; }
    if (!target || !target.getAttribute) { return; }
    var index = parseInt(target.getAttribute('data-index'), 10);
    var item = state.searchItems[index];
    if (!item) { return; }
    toggleStop(item);
  }

  function toggleStop(item) {
    var stopIds = state.stopIds.slice();
    var found = -1;
    for (var i = 0; i < stopIds.length; i++) {
      if (stopIdOf(stopIds[i]) === item.id) { found = i; break; }
    }
    if (found !== -1) {
      stopIds.splice(found, 1);
    } else {
      stopIds.push(item.line_ids && item.line_ids.length ? item.id + '{' + item.line_ids.join(',') + '}' : item.id);
    }
    state.stopIds = stopIds;
    if (!state.limit) { state.limit = DEFAULT_LIMIT; }
    saveStopIds();
    if (window.history && window.history.replaceState) {
      try { window.history.replaceState(null, '', boardPath()); } catch (e) { /* ignore */ }
    }
    renderSearchResults();
    updateSettingsButton();
    refresh();
  }

  // ------------------------------------------------------------------- init

  function bindIdleEvents() {
    var events = ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'click', 'keydown'];
    for (var i = 0; i < events.length; i++) {
      window.addEventListener(events[i], resetIdleTimer, false);
    }
    window.addEventListener('scroll', resetIdleTimer, true);
  }

  function init() {
    // PWA entry point (?standalone=1): restore the last board.
    if (APP.standalone && !state.stopIds.length) {
      var saved = null;
      try { saved = localStorage.getItem('stopIds'); } catch (e) { saved = null; }
      if (saved) {
        window.location.replace(BASE + '/' + saved + (state.limit ? '?limit=' + state.limit : ''));
        return;
      }
    }

    if (state.stopIds.length) {
      saveStopIds();
      showSettings(false);
    } else {
      addClass($('loading'), 'hidden');
      showSettings(true);
    }
    updateSettingsButton();

    $('settings-button').onclick = function () { showSettings(true); };
    $('settings-close').onclick = function () { showSettings(false); };
    $('settings-validate').onclick = function () { if (state.stopIds.length) { showSettings(false); } };
    $('search').oninput = onSearchInput;
    $('search').onkeyup = onSearchInput; // fallback for engines without the input event
    $('search-results').onclick = onResultClick;
    bindIdleEvents();

    renderFooter();
    refresh();
    setInterval(refresh, REFRESH_INTERVAL);
    setInterval(function () { renderBoard(); renderFooter(); }, TICK_INTERVAL);
    window.onresize = renderFooter;
  }

  if (document.readyState === 'loading' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', init, false);
  } else {
    init();
  }
})();
