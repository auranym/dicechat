export class Alert extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /* html */`
    <dialog class="full-width panel border-black">
      <div class="hflex align-center justify-space-between">
        <p>Hello world!</p>
        <form method="dialog">
          <button autofocus aria-label="Close" class="hinflex align-center gap-sm">
            <dc-icon icon="x"></dc-icon>
          </button>
        </form>
      </div>
    </dialog>
    `;
  }

  showAlert(alert, { color = '', isClosable = true } = {}) {
    const dialog = this.querySelector('dialog');
    const p = this.querySelector('p');
    const form = this.querySelector('form');

    if (!(dialog && p && form)) {
      console.warn('Could not show alert');
      if (dialog?.open) {
        dialog.close();
      }
      return;
    }

    p.innerText = alert;
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

  hideAlert() {
    const dialog = this.querySelector('dialog');
    if (dialog.open) {
      dialog.close();
    }
  }
}

customElements.define('dc-alert', Alert);