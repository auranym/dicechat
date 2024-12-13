import DOMPurify from 'dompurify';
import { validateRoomCode, Client, Host, showAlert, hideAlert } from '../lib';

export class Home extends HTMLElement {
  /**
   * Callback when a room is created or joined.
   * The single parameter is a Host or Client object,
   * depending on what the user does.
   * @type {function}
   */
  onReady;
  
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    // Render HTML
    this.innerHTML = /* html */`
    <main class="vflex align-center gap-xs">
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
    this.querySelector('#room-code').oninput = this._onRoomCodeInput.bind(this);
    this.querySelector('#join').onclick = this._onJoin.bind(this);
    this.querySelector('#host').onclick = this._onHost.bind(this);
  }

  _setStatus(statusElement, { isHidden = false, message, isError = false }) {
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

  _setHostStatus(config) {
    this._setStatus(this.querySelector('#host-status'), config);
    this._setStatus(this.querySelector('#join-status'), { isHidden: true });
  }

  _setJoinStatus(config) {
    this._setStatus(this.querySelector('#join-status'), config);
    this._setStatus(this.querySelector('#host-status'), { isHidden: true });
  }

  _setDisabled(val) {
    this.querySelector('#username').disabled = val;
    this.querySelector('#room-code').disabled = val;
    this.querySelector('#join').disabled = val;
    this.querySelector('#host').disabled = val;
  }

  _getUsername() {
    return DOMPurify.sanitize(this.querySelector('#username').value);
  }

  _onRoomCodeInput(val) {
    val.target.value = val.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    // Hide error status
    this._setJoinStatus({ isHidden: true });
    this._setHostStatus({ isHidden: true });
  }

  _onJoin() {
    // Check for username.
    const username = this._getUsername();
    if (username.length === 0) {
      this._setJoinStatus({ message: 'Invalid username.', isError: true });
      return;
    }

    // Check room code and show error if invalid.
    const roomCode = this.querySelector('#room-code')?.value;
    if (!validateRoomCode(roomCode)) {
      this._setJoinStatus({ message: 'Invalid room code.\nIt must be 6 letters long.', isError: true });
      return;
    }

    // Attempt to connect.
    this._setDisabled(true);
    this._setJoinStatus({ isHidden: true });
    showAlert('Connecting...', { isClosable: false });
    const client = new Client({
      username,
      roomCode,
      // onConnected: () => showAlert('Connected to room!'),
      onConnected: () => this.onReady?.(client),
      onFailure: reason => {
        showAlert(reason);
        this._setDisabled(false);
      },
      // onMessage: message => console.log(message)
    });
  }

  _onHost() {
    // Check for username.
    const username = this._getUsername();
    if (username.length === 0) {
      this._setHostStatus({ message: 'Invalid username.', isError: true });
      return;
    }

    // Attempt to connect
    this._setDisabled(true);
    this._setHostStatus({ isHidden: true });
    showAlert('Connecting...', { isClosable: false });
    const host = new Host({
      username,
      // onOpen: roomCode => showAlert('Created room with code ' + roomCode),
      onOpen: () => this.onReady?.(host),
      onFailure: reason => {
        showAlert(reason);
        this._setDisabled(false);
      },
      // onMessage: (username, message) => console.log(`${username}: ${message}`),
      // onJoin: username => console.log(`${username} joined!`),
      // onLeave: username => console.log(`${username} left.`)
    });
  }
}

customElements.define('dc-home', Home);
