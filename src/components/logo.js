export class Logo extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    this.innerHTML = /* html */`<span class="hinflex align-center">Dice<dc-icon icon="dice"></dc-icon>Chat</span>`;
  }
}

customElements.define('dc-logo', Logo);