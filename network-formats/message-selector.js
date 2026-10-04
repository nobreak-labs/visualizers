/* 메시지 형식별 도표와 필드 설명을 함께 선택합니다. */
(() => {
  document.querySelectorAll('[data-message-selector]').forEach((selector) => {
    const section = selector.closest('.diagram-card');
    const panels = [...section.querySelectorAll('[data-message-panel]')];
    const buttons = [...selector.querySelectorAll('button[data-message]')];
    const details = [...section.querySelectorAll('[data-message-for]')];
    const valid = new Set(['all', ...panels.map((panel) => panel.id)]);

    function show(message, updateHash = false) {
      if (!valid.has(message)) return;
      section.classList.toggle('message-filtered', message !== 'all');
      panels.forEach((panel) => { panel.hidden = message !== 'all' && panel.id !== message; });
      buttons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.message === message));
      });
      details.forEach((detail) => {
        const messages = detail.dataset.messageFor.split(/\s+/);
        detail.hidden = message !== 'all' && !messages.includes('*') && !messages.includes(message);
      });
      if (updateHash) history.replaceState(null, '', `#${message}`);
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => show(button.dataset.message, true));
    });
    const fromHash = () => {
      const message = location.hash.slice(1);
      show(valid.has(message) ? message : selector.dataset.defaultMessage);
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  });
})();
