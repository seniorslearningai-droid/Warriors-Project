// Minimal local-only login (Firebase multiplayer added in next step)
window.addEventListener('DOMContentLoaded', () => {
  const prefixInput = document.getElementById('name-prefix');
  const suffixInput = document.getElementById('name-suffix');
  const preview = document.getElementById('name-preview');
  const colorInput = document.getElementById('cat-color');
  const joinBtn = document.getElementById('join-btn');
  const errorMsg = document.getElementById('error-msg');

  // Check if already has a character
  const saved = localStorage.getItem('tribeCat');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      document.getElementById('loading-panel')?.classList.add('hidden');
      document.getElementById('create-form')?.classList.add('hidden');
      const rp = document.getElementById('returning-panel');
      rp?.classList.remove('hidden');
      const rn = document.getElementById('returning-name');
      if (rn) rn.textContent = `Welcome back, ${data.name}!`;
    } catch (_) {}
  } else {
    document.getElementById('loading-panel')?.classList.add('hidden');
    document.getElementById('create-form')?.classList.remove('hidden');
  }

  const updatePreview = () => {
    const p = capitalize(prefixInput.value.trim());
    const s = suffixInput.value.trim().toLowerCase();
    preview.textContent = p && s ? p + s : '…';
  };

  prefixInput?.addEventListener('input', updatePreview);
  suffixInput?.addEventListener('input', updatePreview);

  joinBtn?.addEventListener('click', () => {
    const prefix = capitalize(prefixInput.value.trim());
    const suffix = suffixInput.value.trim().toLowerCase();
    const color = colorInput.value;

    if (!prefix || !suffix) {
      errorMsg.textContent = 'Enter both a prefix and a suffix.';
      return;
    }

    const name = prefix + suffix;
    const isLeader = name === 'Jadewind';

    localStorage.setItem('tribeCat', JSON.stringify({
      name,
      color,
      rank: isLeader ? 'leader' : 'kit'
    }));

    window.location.href = 'game.html';
  });

  document.getElementById('continue-btn')?.addEventListener('click', () => {
    window.location.href = 'game.html';
  });

  document.getElementById('new-char-btn')?.addEventListener('click', () => {
    localStorage.removeItem('tribeCat');
    document.getElementById('returning-panel')?.classList.add('hidden');
    document.getElementById('create-form')?.classList.remove('hidden');
  });
});

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}
