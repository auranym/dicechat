export class Message extends HTMLElement {
  static observedAttributes = ['user', 'message'];
  shadowRoot;

  constructor() {
    super();
    this.user = '??';
    this.message = '';
    this.shadowRoot = this.attachShadow({
      mode: 'open'
    });
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this[name] = newValue;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = /*html*/ `
    <p>
      <span>${this.user}:</span> ${this.message}
    </p>
    <style>
      p {
        margin: 0;
      }
    
      span {
        font-weight: var(--font-weight-bold)
      }
    </style>
    `;
  }
}

customElements.define('dc-message', Message);