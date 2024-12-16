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

    // Since the URL is dynamic, we have to get the base url for public assets.
    // See: https://vite.dev/guide/build.html#public-base-path    
    const url = `${import.meta.env.BASE_URL}/icons/${this.icon}.svg#svg-id`;
    this.innerHTML = /* html */`
      <svg width="100%" height="100%">
        <use href="${url}" />
      </svg>
    `;
  }
}

customElements.define('dc-icon', Icon);