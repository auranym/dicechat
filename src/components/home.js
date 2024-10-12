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
            <p id="join-status" class="text-centered" hidden="true"></p>
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

  setStatus(statusElement, { isHidden = false, message, isError = false }) {
    if (!statusElement) {
      return;
    }

    if (isHidden) {
      statusElement.hidden = true;
      return;
    }
    else {
      statusElement.hidden = false;
    }

    statusElement.innerText = message;

    if (isError) {
      statusElement.classList.add('text-red');
    }
    else {
      statusElement.classList.remove('text-red');
    }
  }

  setHostStatus(config) {
    this.setStatus(this.querySelector('#host-status'), config);
    this.setStatus(this.querySelector('#join-status'), { isHidden: true });
  }

  setJoinStatus(config) {
    this.setStatus(this.querySelector('#join-status'), config);
    this.setStatus(this.querySelector('#host-status'), { isHidden: true });
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
    this.setJoinStatus({ hidden: true });
    this.setHostStatus({ hidden: true });
  }

  onJoin() {
    // Check for username.
    if (this.getUsername().length === 0) {
      this.setJoinStatus({ message: 'Invalid username.', isError: true });
      return;
    }

    // Check room code and show error if invalid.
    if (!validateRoomCode(this.querySelector('#room-code').value)) {
      this.setJoinStatus({ message: 'Invalid room code.\nIt must be 6 letters long.', isError: true });
      return;
    }

    // Attempt to connect.
    this.setDisabled(true);
    this.setJoinStatus({ message: 'Connecting...' });
  }

  onHost() {
    // Check for username.
    if (this.getUsername().length === 0) {
      this.setHostStatus({ message: 'Invalid username.', isError: true });
      return;
    }

    // Attempt to connect
    this.setDisabled(true);
    this.setHostStatus({ message: 'Creating room...' });
  }
}

customElements.define('dc-home', Home);
