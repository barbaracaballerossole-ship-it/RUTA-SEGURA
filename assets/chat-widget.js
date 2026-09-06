// Widget de chat flotante de Ruta Segura — un solo archivo, incluido con
// <script src="assets/chat-widget.js"></script> antes de </body> en cada
// página. Se apoya en las variables de marca (--rs-primary/--rs-accent/
// --rs-bg) que cada pantalla ya define en :root, con respaldo por si alguna
// página futura no las define. Habla con api/chatbot.mjs.
(function () {
  'use strict';

  // Evita doble inyección si el script se incluye más de una vez.
  if (document.getElementById('rscw-panel')) { return; }

  var STYLE = `
    #rscw-toggle-btn {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: var(--rs-accent, #087E8B);
      color: #fff;
      box-shadow: 0 8px 20px rgba(11, 57, 84, 0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1050;
      padding: 0;
      transition: transform 0.15s ease-out;
    }

    #rscw-toggle-btn:hover,
    #rscw-toggle-btn:focus {
      transform: scale(1.06);
    }

    #rscw-toggle-btn svg {
      width: 26px;
      height: 26px;
    }

    #rscw-panel {
      position: fixed;
      right: 1.25rem;
      bottom: 5.5rem;
      width: min(320px, calc(100vw - 2.5rem));
      max-height: min(440px, calc(100vh - 8rem));
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(11, 57, 84, 0.25);
      border: 1px solid rgba(11, 57, 84, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 1049;
      font-family: 'Open Sans', sans-serif;
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: opacity 0.15s ease-out, transform 0.15s ease-out;
    }

    #rscw-panel.rscw-open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    #rscw-panel .rscw-header {
      background: var(--rs-primary, #0B3954);
      color: #fff;
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    #rscw-panel .rscw-header-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      margin: 0;
    }

    #rscw-panel .rscw-header-subtitle {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.75);
    }

    #rscw-close-btn {
      background: none;
      border: none;
      color: #fff;
      opacity: 0.85;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      flex-shrink: 0;
    }

    #rscw-close-btn:hover,
    #rscw-close-btn:focus {
      opacity: 1;
    }

    #rscw-close-btn svg {
      width: 18px;
      height: 18px;
    }

    #rscw-messages {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 0.85rem;
      background: var(--rs-bg, #F7F7F2);
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      min-height: 160px;
    }

    #rscw-messages .rscw-msg {
      max-width: 88%;
      padding: 0.55rem 0.8rem;
      border-radius: 14px;
      font-size: 0.85rem;
      line-height: 1.4;
      word-wrap: break-word;
      box-shadow: 0 2px 6px rgba(11, 57, 84, 0.08);
    }

    #rscw-messages .rscw-msg-bot {
      background: #fff;
      color: var(--rs-primary, #0B3954);
      border-radius: 14px 14px 14px 4px;
      align-self: flex-start;
    }

    #rscw-messages .rscw-msg-user {
      background: var(--rs-accent, #087E8B);
      color: #fff;
      border-radius: 14px 14px 4px 14px;
      align-self: flex-end;
    }

    #rscw-messages .rscw-msg-error {
      background: rgba(220, 53, 69, 0.08);
      border: 1px solid rgba(220, 53, 69, 0.35);
      color: #a02330;
    }

    #rscw-typing-dots span {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--rs-accent, #087E8B);
      margin-right: 3px;
      animation: rscw-blink 1.4s infinite both;
    }
    #rscw-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    #rscw-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes rscw-blink {
      0%, 80%, 100% { opacity: 0.2; }
      40% { opacity: 1; }
    }

    #rscw-form {
      display: flex;
      gap: 0.5rem;
      padding: 0.7rem;
      border-top: 1px solid rgba(11, 57, 84, 0.1);
      background: #fff;
      flex-shrink: 0;
    }

    #rscw-input {
      flex: 1 1 auto;
      min-width: 0;
      border-radius: 10px;
      border: 1px solid rgba(11, 57, 84, 0.2);
      padding: 0.5rem 0.7rem;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.85rem;
      color: var(--rs-primary, #0B3954);
    }

    #rscw-input:focus {
      outline: none;
      border-color: var(--rs-accent, #087E8B);
      box-shadow: 0 0 0 0.2rem rgba(8, 126, 139, 0.15);
    }

    #rscw-send-btn {
      background-color: var(--rs-accent, #087E8B);
      border: none;
      color: #fff;
      font-family: 'Open Sans', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      cursor: pointer;
      flex-shrink: 0;
    }

    #rscw-send-btn:hover,
    #rscw-send-btn:focus {
      background-color: #066b76;
    }

    #rscw-send-btn:disabled {
      opacity: 0.6;
      cursor: default;
    }
  `;

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4.4 3.3A1 1 0 0 1 2 19.5V5a1 1 0 0 1 1-1h1z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  var HTML = `
    <button type="button" id="rscw-toggle-btn" aria-label="Abrir chat de Ruta Segura" aria-expanded="false">${ICON_CHAT}</button>
    <div id="rscw-panel" role="dialog" aria-label="Chat de Ruta Segura">
      <div class="rscw-header">
        <div>
          <p class="rscw-header-title">Ruta Segura</p>
          <div class="rscw-header-subtitle">Pregúntame sobre el servicio</div>
        </div>
        <button type="button" id="rscw-close-btn" aria-label="Cerrar chat">${ICON_CLOSE}</button>
      </div>
      <div id="rscw-messages"></div>
      <form id="rscw-form">
        <label for="rscw-input" class="visually-hidden">Escribe tu mensaje</label>
        <input type="text" id="rscw-input" placeholder="Escribe tu pregunta…" autocomplete="off">
        <button type="submit" id="rscw-send-btn">Enviar</button>
      </form>
    </div>
  `;

  var styleTag = document.createElement('style');
  styleTag.id = 'rscw-style';
  styleTag.textContent = STYLE;
  document.head.appendChild(styleTag);

  var container = document.createElement('div');
  container.id = 'rscw-root';
  container.innerHTML = HTML;
  document.body.appendChild(container);

  var toggleBtn = document.getElementById('rscw-toggle-btn');
  var closeBtn = document.getElementById('rscw-close-btn');
  var panel = document.getElementById('rscw-panel');
  var messages = document.getElementById('rscw-messages');
  var form = document.getElementById('rscw-form');
  var input = document.getElementById('rscw-input');
  var sendBtn = document.getElementById('rscw-send-btn');

  var opened = false;
  var greeted = false;

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(text, kind) {
    var bubble = document.createElement('div');
    bubble.className = 'rscw-msg ' + kind;
    bubble.textContent = text;
    messages.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function addTypingIndicator() {
    var bubble = document.createElement('div');
    bubble.className = 'rscw-msg rscw-msg-bot';
    bubble.id = 'rscw-typing';
    bubble.innerHTML = '<span id="rscw-typing-dots"><span></span><span></span><span></span></span>';
    messages.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function openPanel() {
    opened = true;
    panel.classList.add('rscw-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Cerrar chat de Ruta Segura');
    toggleBtn.innerHTML = ICON_CLOSE;
    if (!greeted) {
      greeted = true;
      addMessage('¡Hola! Soy el asistente de Ruta Segura. Pregúntame sobre servicios, precios, pago o cómo cancelar tu solicitud.', 'rscw-msg-bot');
    }
    input.focus();
  }

  function closePanel() {
    opened = false;
    panel.classList.remove('rscw-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Abrir chat de Ruta Segura');
    toggleBtn.innerHTML = ICON_CHAT;
  }

  toggleBtn.addEventListener('click', function () {
    if (opened) { closePanel(); } else { openPanel(); }
  });

  closeBtn.addEventListener('click', closePanel);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var mensaje = input.value.trim();
    if (!mensaje) { return; }

    addMessage(mensaje, 'rscw-msg-user');
    input.value = '';
    input.focus();

    sendBtn.disabled = true;
    input.disabled = true;
    addTypingIndicator();

    try {
      var res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: mensaje })
      });

      var data = await res.json().catch(function () { return {}; });
      var typingBubble = document.getElementById('rscw-typing');
      if (typingBubble) { typingBubble.remove(); }

      if (!res.ok || !data.respuesta) {
        addMessage(
          data && data.error ? JSON.stringify(data.error) : 'No pudimos responder tu pregunta. Intenta de nuevo.',
          'rscw-msg-bot rscw-msg-error'
        );
      } else {
        addMessage(data.respuesta, 'rscw-msg-bot');
      }
    } catch (err) {
      var typingBubbleErr = document.getElementById('rscw-typing');
      if (typingBubbleErr) { typingBubbleErr.remove(); }
      addMessage(err && err.message ? err.message : String(err), 'rscw-msg-bot rscw-msg-error');
    } finally {
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });
})();
