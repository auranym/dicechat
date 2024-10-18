export class Message extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    this.innerHTML = /* html */`
    <dialog class="full-width panel border-black">
      <div class="hflex align-center justify-space-between">
        <p>Hello world!</p>
        <form method="dialog">
          <button autofocus aria-label="Close message" class="hinflex align-center">
            <dc-icon icon="x"></dc-icon>
          </button>
        </form>
      </div>
    </dialog>
    `;
  }

  showMessage(message, { color = '', isClosable = true }) {
    const dialog = this.querySelector('dialog');
    const p = this.querySelector('p');
    const form = this.querySelector('form');

    if (!(dialog && p && form)) {
      console.warn('Could not show message');
      if (dialog?.open) {
        dialog.close();
      }
      return;
    }

    p.innerText = message;
    if (color === 'red' || color === 'blue') {
      p.className = 'text-' + color;
    }
    else {
      p.className = '';
    }

    form.hidden = !isClosable;
    if (!dialog.open) {
      dialog.show();
    }
  }

  hideMessage() {
    if (dialog.open) {
      dialog.close();
    }
  }
}

customElements.define('dc-message', Message);