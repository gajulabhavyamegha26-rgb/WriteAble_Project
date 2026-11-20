/* =====================================================================
   WriteAble - accessibility toolbar
   Adds a floating "Accessibility" button (bottom right) with:
     - text size  (A- / Reset / A+)
     - theme      (Light / Dark / High contrast)
     - wider letter, word and line spacing
     - dyslexia-friendly font (OpenDyslexic)
     - read aloud (editor text, selected text, or the page content)
   Settings are remembered in the browser (localStorage).
   Pair with css/accessibility.css
   ===================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'writeable-a11y';
  var SIZES = [100, 115, 130, 150];
  var THEMES = ['light', 'dark', 'contrast'];
  var root = document.documentElement;

  var settings = { size: 100, theme: 'light', spacing: false, dyslexic: false };
  var fontLoaded = false;

  /* ---------- load / save / apply ---------- */
  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        if (SIZES.indexOf(saved.size) !== -1) settings.size = saved.size;
        if (THEMES.indexOf(saved.theme) !== -1) settings.theme = saved.theme;
        settings.spacing = saved.spacing === true;
        settings.dyslexic = saved.dyslexic === true;
      }
    } catch (e) { /* storage blocked or empty: use defaults */ }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  function apply() {
    root.setAttribute('data-text-size', String(settings.size));
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-spacing', settings.spacing ? 'on' : 'off');
    root.setAttribute('data-font', settings.dyslexic ? 'dyslexic' : 'default');
    if (settings.dyslexic) loadDyslexicFont();
  }

  // the OpenDyslexic font is only downloaded the first time it is switched on
  function loadDyslexicFont() {
    if (fontLoaded) return;
    fontLoaded = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.cdnfonts.com/css/open-dyslexic';
    document.head.appendChild(link);
  }

  load();
  apply();

  /* ---------- build the toolbar ---------- */
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'a11y-toggle';
  toggle.id = 'a11yToggle';
  toggle.textContent = 'Accessibility';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'a11yPanel');

  var panel = document.createElement('div');
  panel.className = 'a11y-panel';
  panel.id = 'a11yPanel';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Accessibility options');
  panel.hidden = true;
  panel.innerHTML =
    '<p class="a11y-label" id="a11yTextLabel">Text size</p>' +
    '<div class="a11y-row" role="group" aria-labelledby="a11yTextLabel">' +
      '<button type="button" class="a11y-btn" data-action="smaller" aria-label="Make text smaller">A-</button>' +
      '<button type="button" class="a11y-btn" data-action="reset">Reset</button>' +
      '<button type="button" class="a11y-btn" data-action="larger" aria-label="Make text larger">A+</button>' +
    '</div>' +
    '<p class="a11y-label" id="a11yThemeLabel">Theme</p>' +
    '<div class="a11y-row" role="group" aria-labelledby="a11yThemeLabel">' +
      '<button type="button" class="a11y-btn" data-theme="light" aria-pressed="false">Light</button>' +
      '<button type="button" class="a11y-btn" data-theme="dark" aria-pressed="false">Dark</button>' +
      '<button type="button" class="a11y-btn" data-theme="contrast" aria-pressed="false">High contrast</button>' +
    '</div>' +
    '<p class="a11y-label" id="a11yReadLabel">Reading</p>' +
    '<div class="a11y-row" role="group" aria-labelledby="a11yReadLabel">' +
      '<button type="button" class="a11y-btn" data-action="spacing" aria-pressed="false">Wider spacing</button>' +
      '<button type="button" class="a11y-btn" data-action="dyslexia" aria-pressed="false">Dyslexia-friendly font</button>' +
      '<button type="button" class="a11y-btn" data-action="speak" id="a11ySpeakBtn">Read aloud</button>' +
    '</div>' +
    '<p class="a11y-status" id="a11yStatus" role="status"></p>';

  document.body.appendChild(panel);
  document.body.appendChild(toggle);

  var statusEl = panel.querySelector('#a11yStatus');
  var speakBtn = panel.querySelector('#a11ySpeakBtn');
  var themeBtns = panel.querySelectorAll('[data-theme]');
  var spacingBtn = panel.querySelector('[data-action="spacing"]');
  var dyslexiaBtn = panel.querySelector('[data-action="dyslexia"]');

  function say(message) { statusEl.textContent = message; }

  function refreshButtons() {
    for (var i = 0; i < themeBtns.length; i++) {
      themeBtns[i].setAttribute('aria-pressed', String(themeBtns[i].getAttribute('data-theme') === settings.theme));
    }
    spacingBtn.setAttribute('aria-pressed', String(settings.spacing));
    dyslexiaBtn.setAttribute('aria-pressed', String(settings.dyslexic));
  }
  refreshButtons();

  /* ---------- open / close ---------- */
  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closePanel(returnFocus) {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    if (panel.hidden) openPanel(); else closePanel(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) closePanel(true);
  });

  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle) closePanel(false);
  });

  /* ---------- text size ---------- */
  function changeSize(step) {
    var index = SIZES.indexOf(settings.size) + step;
    if (index < 0) { say('This is already the smallest text size.'); return; }
    if (index > SIZES.length - 1) { say('This is already the largest text size.'); return; }
    settings.size = SIZES[index];
    apply(); save();
    say('Text size is now ' + settings.size + ' percent.');
  }

  /* ---------- read aloud ---------- */
  var synth = window.speechSynthesis;
  var speaking = false;
  var session = 0; // stops an old, cancelled reading from changing the button

  function setSpeaking(on) {
    speaking = on;
    speakBtn.textContent = on ? 'Stop reading' : 'Read aloud';
  }

  function getTextToRead() {
    var area = document.getElementById('writingArea');
    if (area) {
      var all = area.value;
      var part = all.substring(area.selectionStart, area.selectionEnd).trim();
      return (part || all).trim();
    }
    var selected = window.getSelection ? window.getSelection().toString().trim() : '';
    if (selected) return selected;
    var main = document.getElementById('main');
    return (main ? main.innerText : document.body.innerText).trim();
  }

  function startReading() {
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      say('Read aloud is not supported in this browser.');
      return;
    }
    var text = getTextToRead();
    if (!text) {
      say('There is no text to read yet. Type something in the editor first.');
      return;
    }

    synth.cancel();
    session += 1;
    var mine = session;

    // read sentence by sentence: long single readings can stop early in some browsers
    var parts = text.match(/[^.!?\n]+[.!?]*/g) || [text];
    var chunks = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].trim()) chunks.push(parts[i].trim());
    }

    chunks.forEach(function (chunk, index) {
      var u = new SpeechSynthesisUtterance(chunk);
      u.lang = root.lang || 'en-US';
      u.onerror = function () { if (mine === session) { setSpeaking(false); say('Reading stopped.'); } };
      if (index === chunks.length - 1) {
        u.onend = function () { if (mine === session) { setSpeaking(false); say('Finished reading.'); } };
      }
      synth.speak(u);
    });

    setSpeaking(true);
    say('Reading aloud...');
  }

  function stopReading() {
    session += 1;
    if (synth) synth.cancel();
    setSpeaking(false);
    say('Reading stopped.');
  }

  window.addEventListener('pagehide', function () { if (synth) synth.cancel(); });

  /* ---------- panel buttons ---------- */
  panel.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;

    var theme = btn.getAttribute('data-theme');
    var action = btn.getAttribute('data-action');

    if (theme) {
      settings.theme = theme;
      apply(); save(); refreshButtons();
      say(btn.textContent + ' theme on.');
    } else if (action === 'smaller') {
      changeSize(-1);
    } else if (action === 'larger') {
      changeSize(1);
    } else if (action === 'reset') {
      settings.size = 100;
      apply(); save();
      say('Text size reset to normal.');
    } else if (action === 'spacing') {
      settings.spacing = !settings.spacing;
      apply(); save(); refreshButtons();
      say(settings.spacing ? 'Wider spacing on.' : 'Wider spacing off.');
    } else if (action === 'dyslexia') {
      settings.dyslexic = !settings.dyslexic;
      apply(); save(); refreshButtons();
      say(settings.dyslexic ? 'Dyslexia-friendly font on.' : 'Dyslexia-friendly font off.');
    } else if (action === 'speak') {
      if (speaking) stopReading(); else startReading();
    }
  });
})();
