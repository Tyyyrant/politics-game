// Custom modal dialog to replace prompt() in Electron
export function showPrompt(title, defaultValue = '') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <input type="text" class="modal-input" value="${defaultValue}" id="modal-input" autofocus>
        <div class="modal-buttons">
          <button class="modal-btn modal-cancel">取消</button>
          <button class="modal-btn modal-ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#modal-input');
    const ok = overlay.querySelector('.modal-ok');
    const cancel = overlay.querySelector('.modal-cancel');

    const cleanup = (val) => {
      overlay.remove();
      resolve(val);
    };

    ok.addEventListener('click', () => cleanup(input.value));
    cancel.addEventListener('click', () => cleanup(null));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') cleanup(input.value);
      if (e.key === 'Escape') cleanup(null);
    });
    input.focus();
    input.select();
  });
}

export function showSelect(title, options) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const optionHtml = options.map((o, i) =>
      `<button class="select-option" data-idx="${i}">${o.label}</button>`
    ).join('');
    overlay.innerHTML = `
      <div class="modal-box modal-select">
        <div class="modal-title">${title}</div>
        <div class="select-options">${optionHtml}</div>
        <button class="modal-btn modal-cancel" style="margin-top:8px">取消</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.select-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        overlay.remove();
        resolve(options[idx].value);
      });
    });
    overlay.querySelector('.modal-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });
  });
}

export function showAlert(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">提示</div>
        <div class="modal-message">${message}</div>
        <div class="modal-buttons">
          <button class="modal-btn modal-ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-ok').addEventListener('click', () => {
      overlay.remove();
      resolve();
    });
  });
}
