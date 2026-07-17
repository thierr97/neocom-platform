import { Request, Response } from 'express';
import { chat, rateConversation } from '../services/chatbot.service';

/**
 * Assistant client IA — endpoints PUBLICS de la boutique (rate-limités).
 */

// POST /api/chatbot/message  body: { sessionId, message, email? }
export const postMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId, message, email } = req.body || {};
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 64) {
      return res.status(400).json({ success: false, message: 'sessionId invalide (8-64 caractères)' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message requis' });
    }

    const result = await chat({
      sessionId,
      message: message.trim(),
      customerEmail: typeof email === 'string' && /@/.test(email) ? email : null,
    });

    res.json({ success: true, ...result });
  } catch (e: any) {
    console.error('[chatbot] message:', e.message);
    res.status(500).json({
      success: false,
      message: "L'assistant est momentanément indisponible — réessayez dans un instant",
    });
  }
};

// POST /api/chatbot/feedback  body: { sessionId, rating (1-5), resolved? }
export const postFeedback = async (req: Request, res: Response) => {
  try {
    const { sessionId, rating, resolved } = req.body || {};
    if (!sessionId || !Number.isFinite(Number(rating))) {
      return res.status(400).json({ success: false, message: 'sessionId et rating requis' });
    }
    await rateConversation(String(sessionId), Number(rating), resolved === undefined ? undefined : Boolean(resolved));
    res.json({ success: true, message: 'Merci pour votre retour !' });
  } catch (e: any) {
    res.status(400).json({ success: false, message: 'Conversation introuvable' });
  }
};

// GET /api/chatbot/widget.js — script embarquable sur n'importe quelle page
export const getWidget = async (_req: Request, res: Response) => {
  res.type('application/javascript').send(WIDGET_JS);
};

/**
 * Widget autonome (aucune dépendance) : bulle en bas à droite, panneau de chat,
 * sessionId persistant en mémoire de page. À intégrer côté boutique avec :
 *   <script src="https://VOTRE-BACKEND/api/chatbot/widget.js" defer></script>
 */
const WIDGET_JS = `(function () {
  if (window.__neoChatLoaded) return; window.__neoChatLoaded = true;
  var API = (document.currentScript && document.currentScript.src.replace(/\\/api\\/chatbot\\/widget\\.js.*$/, '')) || '';
  var sid = 'neo-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  var open = false, busy = false;

  var css = '#neochat-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:#1F4E79;color:#fff;border:none;cursor:pointer;font-size:26px;box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:99998}'
    + '#neochat-panel{position:fixed;bottom:92px;right:20px;width:340px;max-width:calc(100vw - 40px);height:480px;max-height:70vh;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;z-index:99999;font-family:system-ui,sans-serif}'
    + '#neochat-panel.open{display:flex}'
    + '#neochat-head{background:#1F4E79;color:#fff;padding:12px 16px;font-weight:600}'
    + '#neochat-head small{display:block;font-weight:400;opacity:.8;font-size:11px}'
    + '#neochat-msgs{flex:1;overflow-y:auto;padding:12px;background:#f5f7fa}'
    + '.neochat-m{margin:6px 0;padding:9px 12px;border-radius:12px;font-size:13.5px;line-height:1.45;max-width:85%;white-space:pre-wrap;word-break:break-word}'
    + '.neochat-m.user{background:#1F4E79;color:#fff;margin-left:auto;border-bottom-right-radius:4px}'
    + '.neochat-m.bot{background:#fff;border:1px solid #e3e8ef;border-bottom-left-radius:4px}'
    + '#neochat-form{display:flex;border-top:1px solid #e3e8ef}'
    + '#neochat-in{flex:1;border:none;padding:12px;font-size:14px;outline:none}'
    + '#neochat-send{border:none;background:#1F4E79;color:#fff;padding:0 18px;cursor:pointer;font-size:16px}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var btn = document.createElement('button'); btn.id = 'neochat-btn'; btn.setAttribute('aria-label', 'Assistant NeoServ'); btn.textContent = '💬';
  var panel = document.createElement('div'); panel.id = 'neochat-panel';
  panel.innerHTML = '<div id="neochat-head">Néo — Assistant NeoServ<small>Réponses 7j/7 · un humain reste joignable au 0690 97 37 10</small></div>'
    + '<div id="neochat-msgs"></div>'
    + '<form id="neochat-form"><input id="neochat-in" placeholder="Votre question…" maxlength="500" autocomplete="off"/><button id="neochat-send" type="submit">➤</button></form>';
  document.body.appendChild(btn); document.body.appendChild(panel);

  var msgs = panel.querySelector('#neochat-msgs');
  function add(role, text) {
    var d = document.createElement('div'); d.className = 'neochat-m ' + role; d.textContent = text;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  add('bot', 'Bonjour 👋 Je suis Néo, l\\'assistant NeoServ. Je peux vous aider à trouver un produit, suivre une commande ou répondre à vos questions sur la livraison et les retours.');

  btn.addEventListener('click', function () { open = !open; panel.classList.toggle('open', open); });

  panel.querySelector('#neochat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var input = panel.querySelector('#neochat-in');
    var text = input.value.trim(); if (!text) return;
    input.value = ''; add('user', text);
    var wait = add('bot', '…'); busy = true;
    fetch(API + '/api/chatbot/message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, message: text })
    }).then(function (r) { return r.json(); }).then(function (d) {
      wait.textContent = d && d.reply ? d.reply : 'Désolé, une erreur est survenue. Réessayez ou appelez le 0690 97 37 10.';
    }).catch(function () {
      wait.textContent = 'Connexion impossible — vérifiez votre réseau ou appelez le 0690 97 37 10.';
    }).finally(function () { busy = false; });
  });
})();`;
