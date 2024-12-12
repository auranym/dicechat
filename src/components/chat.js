const MAX_MESSAGES = 300; // This was chosen arbitrarily...

export class Chat extends HTMLElement {
  messages;

  constructor() {
    super();
    this.messages = [];
    this.render();
  }

  addMessage(message) {
    this.messages.push(message);
    if (this.messages.length >= MAX_MESSAGES) {
      this.messages = this.messages.slice(1);
    }
    this.render();
  }

  render() {
    // This is kind of hacky, but keep the position of the scrollbar
    // so that it can be reset to this position after the DOM is updated.
    let ul = this.querySelector('ul');
    const scrollTop = ul?.scrollTop;
    // Make a note of whether the scroll bar is at the bottom
    // (Threshold of 10px)
    const isAtBottom = Math.abs(scrollTop + ul?.clientHeight - ul?.scrollHeight) < 8.0;

    // Render HTML
    this.innerHTML = /* html */`
    <ul class="vflex gap-xxs">
      ${this.messages.map(message => /* html */`<li><p>${message}</p></li>`).join('')}
    </ul>
    `;

    ul = this.querySelector('ul');
    // Update scroll to be at the bottom
    if (isAtBottom) {
      ul.scrollTop = ul.scrollHeight - ul.clientHeight;
    }
    // Check for type, since the first render does not have
    // a scrollTop value.
    else if (typeof scrollTop === 'number') {
      ul.scrollTop = scrollTop;
    }
  }
}

customElements.define('dc-chat', Chat);
