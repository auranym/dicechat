import DOMPurify from 'dompurify';
import { Message } from '../lib';

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
      <h1 class="text-centered h3">${this.host}'s room</h1>
      <div class="vflex panel full-width gap-xs">
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
      if (event.keyCode === 13) {
        this._onSend();
      }
    };
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

  _onSend() {
    // No need to do any safety checks... I think.
    const messageInput = this.querySelector('#message');

    if (messageInput.value) {
      this.onSend?.(DOMPurify.sanitize(messageInput.value));
      messageInput.value = '';
    }

    messageInput.focus();
  }
}

customElements.define('dc-room', Room);