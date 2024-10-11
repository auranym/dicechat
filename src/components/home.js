import { validateRoomCode } from '../lib';

export class Home extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    // Render HTML
    this.innerHTML = /* html */`
    <div class="vflex align-center gap-lg">
      <section class="full-width panel vflex align-center gap-md">
        <div class="vflex align-center gap-xs">
          <label for="room-code" class="font-md font-bold">Join a room</label>
          <p id="room-code-status" hidden="true" style="margin: 0"></p>
        </div>
        <div class="hflex align-center gap-xs">
          <input
            id="room-code"
            type="text"
            autocomplete="off"
            placeholder="Enter code"
          />
          <button id="room-join">Join</button>
        </div>
      </section>
      <section class="full-width panel vflex align-center gap-md">
        <div class="vflex align-center gap-xs">
          <label for="room-host" class="font-md font-bold">Host a room</label>
          <p id="room-host-status" hidden="true" style="margin: 0"></p>
        </div>
        <button id="room-host">Host</button>
      </section>
    </div>
    `;

    // Hydrate
    this.querySelector('#room-code').oninput = this.onInput.bind(this);
    this.querySelector('#room-join').onclick = this.onJoin.bind(this);
    this.querySelector('#room-host').onclick = this.onHost.bind(this);
  }

  setDisabled(val) {
    this.querySelector('#room-code').disabled = val;
    this.querySelector('#room-join').disabled = val;
    this.querySelector('#room-host').disabled = val;
  }

  onInput(val) {
    val.target.value = val.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    // Hide error status
    const status = this.querySelector('#room-code-status');
    if (!status.hidden) {
      status.hidden = true;
    }
  }

  onJoin() {
    const status = this.querySelector('#room-code-status');
    // Check room code and show error if invalid.
    if (!validateRoomCode(this.querySelector('#room-code').value)) {
      status.hidden = false;
      status.innerText = 'Invalid room code. It must be 6 letters long.';
      status.classList.add('text-red');
      return;
    }

    // Attempt to connect.
    this.setDisabled(true);
    status.hidden = false;
    status.innerText = 'Connecting...';
    status.classList.remove('text-red');
  }

  onHost() {
    const status = this.querySelector('#room-host-status');
    // Attempt to connect
    this.setDisabled(true);
    status.hidden = false;
    status.innerText = 'Creating room...';
    status.classList.remove('text-red');
  }
}

customElements.define('dc-home', Home);
