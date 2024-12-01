export class Room extends HTMLElement {
  static observedAttributes = ['host', 'code'];

  constructor() {
    super();
    this.render();
  }

  render() {
    this.innerHTML = /* html */`
    <main class="vflex align-center gap-xs">
      <h1 class="text-centered">${this.host}'s room</h1>
      <div class="panel full-width chat-height">
        <dc-chat class="full-width"></dc-chat>
      </div>
    </main>
    `;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this[name] = newValue;
    this.render();
  }
}

customElements.define('dc-room', Room);