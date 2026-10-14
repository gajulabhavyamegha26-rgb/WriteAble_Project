/* =====================================================================
   WriteAble - voice-to-text input
   OWNER: Megha
   Needs these ids on the page (see editor.html):
     #micBtn  #micLabel  #listening  #voiceMsg  and Esha's  #editor
   How it connects to Esha's editor:
     final speech results are appended to #editor, then an "input" event is
     fired so Esha's word/sentence counter updates.
   Works in Chrome / Edge (SpeechRecognition). Other browsers get a message.
   ===================================================================== */
(function () {
  'use strict';

  var micBtn = document.getElementById('micBtn');
  var editor = document.getElementById('editor');
  if (!micBtn || !editor) return;

  var micLabel = document.getElementById('micLabel');
  var indicator = document.getElementById('listening');
  var msgEl = document.getElementById('voiceMsg');

  function showMessage(text) {
    msgEl.textContent = text;
    msgEl.hidden = !text;
  }

  /* ---------- browser support check ---------- */
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.disabled = true;
    showMessage('Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    return;
  }

  var recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;      // keep listening until the user stops
  recognition.interimResults = false; // only insert finished phrases

  var listening = false;

  function setListeningUi(on) {
    listening = on;
    indicator.hidden = !on;
    micBtn.classList.toggle('is-listening', on);
    micBtn.setAttribute('aria-pressed', String(on));
    micLabel.textContent = on ? 'Stop listening' : 'Start speaking';
  }

  /* ---------- button ---------- */
  micBtn.addEventListener('click', function () {
    showMessage('');
    if (listening) {
      recognition.stop();
    } else {
      try { recognition.start(); } catch (e) { /* already starting */ }
    }
  });

  /* ---------- recognition events ---------- */
  recognition.onstart = function () { setListeningUi(true); };

  recognition.onresult = function (event) {
    var spoken = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) spoken += event.results[i][0].transcript;
    }
    spoken = spoken.trim();
    if (spoken) insertText(spoken);
  };

  recognition.onerror = function (event) {
    var messages = {
      'not-allowed': 'Microphone access was blocked. Allow the microphone in your browser and try again.',
      'service-not-allowed': 'Microphone access was blocked. Allow the microphone in your browser and try again.',
      'no-speech': 'No speech was heard. Try again and speak a little closer to the microphone.',
      'audio-capture': 'No microphone was found. Please connect one and try again.',
      'network': 'Voice input needs an internet connection. Please check yours.'
    };
    showMessage(messages[event.error] || 'Voice input stopped unexpectedly (' + event.error + ').');
  };

  recognition.onend = function () { setListeningUi(false); };

  /* ---------- put the words into Esha's editor ---------- */
  function insertText(spoken) {
    var current = editor.value;
    var startsSentence = !current.trim() || /[.!?]\s*$/.test(current);
    if (startsSentence) spoken = spoken.charAt(0).toUpperCase() + spoken.slice(1);

    var separator = current && !/\s$/.test(current) ? ' ' : '';
    editor.value = current + separator + spoken;
    editor.scrollTop = editor.scrollHeight;
    editor.dispatchEvent(new Event('input', { bubbles: true })); // updates Esha's counters
  }
})();
