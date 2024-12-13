export class Icon extends HTMLElement {
  static observedAttributes = ['icon'];

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this[name] = newValue;
    this.render();
  }

  render() {
    if (typeof this.icon !== 'string') {
      this.innerHTML = '';
      return;
    }

    // Else...
    this.innerHTML = /* html */`
      <svg width="100%" height="100%">
        <use href="/icons/${this.icon}.svg#svg-id" />
      </svg>
    `;
  }
}

customElements.define('dc-icon', Icon);