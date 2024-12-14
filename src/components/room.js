import DOMPurify from 'dompurify';
import { Message, showAlert } from '../lib';

export class Room extends HTMLElement {
  static observedAttributes = ['host', 'code'];

  /**
   * Callback when the "send" button is clicked and a message
   * should be sent to the room. The input box is emptied
   * when the send button is clicked. The message string
   * is passed as the parameter to this callback.
   * 
   * Note: Hitting the send button does *not* update the view.
   * This should be done via the "addMessage" method with
   * the controller.
   * @type {function}
   */
  onSend;
  /**
   * Callback when the leave button is clicked.
   */
  onLeave;

  /**
   * @type {string}
   */
  _prevSent;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    // Render HTML
    this.innerHTML = /* html */`
    <main class="vflex align-center gap-xs">
      <header class="full-width hflex align-end gap-sm">
        <button id="leave" class="icon-button left" aria-label="Leave the room">
          <dc-icon icon="logout"></dc-icon>
        </button>
        <h1 class="text-centered flex h3">${this.host}'s room</h1>
        <button id="code" class="icon-button right" aria-label="See room code">
          <dc-icon icon="key"></dc-icon>
        </button>
      </header>
      <div class="flex vflex panel full-width gap-xs">
        <dc-chat class="flex full-width"></dc-chat>
        <div class="hflex justify-stretch gap-xs">
          <input
            id="message"
            class="flex"
            type="text"
            autocomplete="off"
            placeholder="Type message..."
          />
          <button id="send" class="icon-button" aria-label="Send message">
            <dc-icon icon="send"></dc-icon>
          </button>
      </div>
      </div>
    </main>
    `;

    // Hydrate
    this.querySelector('#message').onkeydown = event => {
      if (event.code === 'Enter') {
        this._onSend();
      }
      else if (event.code === 'ArrowUp') {
        event.preventDefault();
        this.querySelector('#message').value = this._prevSent ?? '';
      }
    };
    this.querySelector('#leave').onclick = this._onLeave.bind(this);
    this.querySelector('#code').onclick = this._onCode.bind(this);
    this.querySelector('#send').onclick = this._onSend.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this[name] = newValue;
    this.render();
  }

  /**
   * Adds the message object to the chat component
   * (via the similarly named addMessage method).
   * @param {Message} message 
   */
  addMessage(message) {
    this.querySelector('dc-chat').addMessage(message);
  }
  
  _onLeave() {
    this.onLeave?.();
  }
  
  _onCode() {
    showAlert(`The room code is ${this.code}.`);
  }

  _onSend() {
    // No need to do any safety checks... I think.
    const messageInput = this.querySelector('#message');

    if (messageInput.value) {
      this.onSend?.(DOMPurify.sanitize(messageInput.value));
      this._prevSent = messageInput.value;
      messageInput.value = '';
    }

    messageInput.focus();
  }
}

customElements.define('dc-room', Room);