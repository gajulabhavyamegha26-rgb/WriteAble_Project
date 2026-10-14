document.addEventListener('DOMContentLoaded', () => {
  // Grab Elements
  const fontSlider = document.getElementById('font-slider');
  const fontSizeVal = document.getElementById('font-size-val');
  const colorPicker = document.getElementById('color-picker');
  const btnLight = document.getElementById('btn-light');
  const btnDark = document.getElementById('btn-dark');
  const btnContrast = document.getElementById('btn-contrast');
  const btnDyslexia = document.getElementById('btn-dyslexia');
  const btnSpeak = document.getElementById('btn-speak');
  const btnSpeakSelected = document.getElementById('btn-speak-selected');
  const btnStop = document.getElementById('btn-stop');

  // 1. Font Size Control
  if (fontSlider) {
    fontSlider.addEventListener('input', (e) => {
      const newSize = e.target.value + 'px';
      document.documentElement.style.setProperty('--font-size', newSize);
      if (fontSizeVal) fontSizeVal.textContent = newSize;
      localStorage.setItem('fontSize', newSize);
    });
  }

  // 2. Font Color Control
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      const selectedColor = e.target.value;
      document.documentElement.style.setProperty('--custom-text-color', selectedColor);
      localStorage.setItem('fontColor', selectedColor);
    });
  }

  // 3. Theme Controls
  function setTheme(themeClass) {
    document.body.classList.remove('dark-mode', 'high-contrast');
    if (themeClass) document.body.classList.add(themeClass);
    localStorage.setItem('theme', themeClass || 'light');

    // Update Button CSS Active States
    btnLight?.classList.toggle('active', themeClass === '');
    btnDark?.classList.toggle('active', themeClass === 'dark-mode');
    btnContrast?.classList.toggle('active', themeClass === 'high-contrast');

    // Clear custom color override when switching to preset themes
    document.documentElement.style.removeProperty('--custom-text-color');
    localStorage.removeItem('fontColor');
  }

  btnLight?.addEventListener('click', () => setTheme(''));
  btnDark?.addEventListener('click', () => setTheme('dark-mode'));
  btnContrast?.addEventListener('click', () => setTheme('high-contrast'));

  // 4. Dyslexia-Friendly Font Toggle
  btnDyslexia?.addEventListener('click', () => {
    const isDyslexic = document.body.classList.toggle('dyslexic-font');
    btnDyslexia.setAttribute('aria-pressed', isDyslexic);
    btnDyslexia.classList.toggle('active', isDyslexic);
    localStorage.setItem('dyslexicFont', isDyslexic);
  });

  // 5. Speech Synthesis (Pause / Resume / Stop / Selected Text)
  let utterance = null;

  // Read Entire Page Content
  btnSpeak?.addEventListener('click', () => {
    const synth = window.speechSynthesis;

    if (synth.paused) {
      synth.resume();
      btnSpeak.textContent = '⏸️ Pause';
      return;
    }

    if (synth.speaking) {
      synth.pause();
      btnSpeak.textContent = '▶ Resume';
      return;
    }

    const contentText = document.getElementById('content')?.innerText || '';
    if (!contentText) return;

    utterance = new SpeechSynthesisUtterance(contentText);
    utterance.onend = () => {
      btnSpeak.textContent = '🔊 Play All';
      btnSpeak.classList.remove('active');
    };

    synth.speak(utterance);
    btnSpeak.textContent = '⏸️ Pause';
    btnSpeak.classList.add('active');
  });

  // Read Highlighted / Selected Text Only
  btnSpeakSelected?.addEventListener('click', () => {
    const selectedText = window.getSelection().toString().trim();

    if (!selectedText) {
      alert('Please highlight/select some text on the page first!');
      return;
    }

    window.speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(selectedText);
    
    utterance.onend = () => {
      btnSpeakSelected.classList.remove('active');
    };

    btnSpeakSelected.classList.add('active');
    window.speechSynthesis.speak(utterance);
  });

  // Stop Reading Completely
  btnStop?.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    if (btnSpeak) btnSpeak.textContent = '🔊 Play All';
    btnSpeak?.classList.remove('active');
    btnSpeakSelected?.classList.remove('active');
  });

  // 6. Load Preserved Settings on Load
  const savedSize = localStorage.getItem('fontSize');
  if (savedSize && fontSlider) {
    document.documentElement.style.setProperty('--font-size', savedSize);
    fontSlider.value = parseInt(savedSize, 10);
    if (fontSizeVal) fontSizeVal.textContent = savedSize;
  }

  const savedColor = localStorage.getItem('fontColor');
  if (savedColor && colorPicker) {
    document.documentElement.style.setProperty('--custom-text-color', savedColor);
    colorPicker.value = savedColor;
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme === 'light' ? '' : savedTheme);
  }

  if (localStorage.getItem('dyslexicFont') === 'true') {
    document.body.classList.add('dyslexic-font');
    btnDyslexia?.setAttribute('aria-pressed', 'true');
    btnDyslexia?.classList.add('active');
  }
});