import DOMPurify from 'dompurify';
import { validateRoomCode } from '../lib';

export class Home extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    // Render HTML
    this.innerHTML = /* html */`
    <main class="vflex align-center gap-xs" style="width: min(400px, calc(100vw - 2 * var(--space-md)))">
      <!-- Heading -->
      <h1 class="text-centered">Welcome to <dc-logo></dc-logo>!</h1>
      <p class="font-md text-centered">Roll dice with friends with<br/>no sign-up and no hassle.</p>

      <!-- Username -->
      <section class="full-width vflex align-stretch">
        <h2 class="text-centered">First...</h2>
        <div class="panel vflex align-stretch gap-sm">
          <label for="username" class="text-centered font-md">Enter a username.</label>
          <input
            id="username"
            type="text"
            autocomplete="off"
            placeholder="Username"
          />
        </div>
      </section>

      <!-- Join or host -->
      <section class="full-width vflex align-stretch">
      <h2 class="text-centered">Then...</h2>
      <div class="panel vflex align-stretch gap-md">
        <!-- Join -->
        <div class="vflex align-stretch gap-sm">
          <div class="vflex align-stretch gap-xs">
            <label for="room-code" class="text-centered font-md">Enter a code to join a room.</label>
            <p id="room-code-status" class="text-centered" hidden="true"></p>
          </div>
          <div class="hflex justify-stretch gap-xs">
            <input
              id="room-code"
              class="flex"
              type="text"
              autocomplete="off"
              placeholder="Room code"
            />
            <button id="join">Join</button>
          </div>
        </div>
        <p class="font-lg font-bold text-centered">Or</p>
        <!-- Host -->
        <div class="vflex align-center gap-sm">
          <div class="vflex align-stretch gap-xs">
            <label for="host" class="text-centered font-md">Host a room yourself.</label>
            <p id="host-status" class="text-centered" hidden="true"></p>
          </div>
          <button id="host">Host</button>
        </div>
      </div>
      </section>
    </main>
    `;

    // Hydrate
    this.querySelector('#room-code').oninput = this.onRoomCodeInput.bind(this);
    this.querySelector('#join').onclick = this.onJoin.bind(this);
    this.querySelector('#host').onclick = this.onHost.bind(this);
  }

  setDisabled(val) {
    this.querySelector('#username').disabled = val;
    this.querySelector('#room-code').disabled = val;
    this.querySelector('#join').disabled = val;
    this.querySelector('#host').disabled = val;
  }

  getUsername() {
    return DOMPurify.sanitize(this.querySelector('#username').value);
  }

  onRoomCodeInput(val) {
    val.target.value = val.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    // Hide error status
    const status = this.querySelector('#room-code-status');
    if (!status.hidden) {
      status.hidden = true;
    }
  }

  onJoin() {
    const status = this.querySelector('#room-code-status');

    // Check for username.
    if (this.getUsername().length === 0) {
      status.hidden = false;
      status.innerText = 'Invalid username.';
      status.classList.add('text-red');
      return;
    }

    // Check room code and show error if invalid.
    if (!validateRoomCode(this.querySelector('#room-code').value)) {
      status.hidden = false;
      status.innerText = 'Invalid room code.\nIt must be 6 letters long.';
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
    const status = this.querySelector('#host-status');
    
    // Check for username.
    if (this.getUsername().length === 0) {
      status.hidden = false;
      status.innerText = 'Invalid username.';
      status.classList.add('text-red');
      return;
    }

    // Attempt to connect
    this.setDisabled(true);
    status.hidden = false;
    status.innerText = 'Creating room...';
    status.classList.remove('text-red');
  }
}

customElements.define('dc-home', Home);
