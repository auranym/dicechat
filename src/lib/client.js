import { Peer } from 'peerjs';
import DOMPurify from 'dompurify';
import { getRoomCodePeerId, validateRoomCode } from './room-code';
import DataPacket from './data-packet';

export default class Client {
  // Public properties
  username;

  // Private properties
  _onConnected;
  _onFailure;
  _roomCode;
  _peer;
  _connection;
  /** Time since last ping received from the host. */
  _lastPing;
  /** Interval that checks when the last ping from the host was received. */
  _pingInterval;

  /**
   * Sets up a client for an existing room.
   * @param {object} configs
   * @param {string} configs.username
   * (Required) The client's username.
   * @param {string} configs.roomCode
   * (Required) The room code.
   * @param {function} configs.onConnect
   * Callback when the client is set up successfully.
   * @param {function} configs.onFailure
   * Callback when the client errors or cannot be set up. Passes a single parameter with the reason for error.
   */
  constructor({ username, roomCode, onConnected, onFailure }) {
    // This *should* have been done already, but just in case,
    // sanitize the username again and check that it is
    // a non-empty string.
    this.username = DOMPurify.sanitize(username ?? '');
    if (this.username === '') {
      if (typeof onFailure === 'function') {
        onFailure('Client username is invalid.');
      }
      return;
    }

    // Make sure there is a valid room code
    if (!validateRoomCode(roomCode)) {
      if (typeof onFailure === 'function') {
        onFailure('Missing/invalid room code.');
      }
      return;
    }

    // Assign properties
    this._onConnected = onConnected;
    this._onFailure = onFailure;
    this._roomCode = roomCode;
    // Create the peer!
    this._peer = new Peer();
    this._peer.on('open', this._on_peer_open.bind(this));
    this._peer.on('error', this._on_peer_error.bind(this));

    // Joining a room involves the following steps,
    // after which, onConnected is called. If any step
    // fails, onFailure is called with the reason (string).
    //
    // 1. Attempt to create a Peer (above)
    // 2. Attempt to connect to the room (in _on_peer_open)
    // 3. Request a username (in _on_connection_open)
    // 4. Receive assigned username from the host (in _on_connection_data)
  }

  /**
   * Sends a data packet to the RoomHost.
   * @param {DataPacket} dataPacket DataPacket being sent.
   */
  send(dataPacket) {
    console.log('CLIENT: sending', JSON.stringify(dataPacket, null, 1));
    this._connection.send(dataPacket);
  }

  /**
   * Leaves the room that this object is connected to.
   */
  leave() {
    this._peer.destroy();
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }
  }

  _on_successfully_joined() {
    // Start an interval that pings the host every so often.
    // This is necessary since if the host closes the browser without
    // closing the room, the connection remains open.
    this._lastPing = Date.now();
    this._pingInterval = setInterval(() => {
      this.send(new DataPacket(DataPacket.PING));
      // If the last ping was more than 5 seconds ago, connection was lost.
      if (Date.now() - this._lastPing > 5000) {
        console.log('Did not receive ping from host in 5+ seconds');
        this._on_connection_close();
      }
    }, 2000);

    if (typeof this._onConnected === 'function') {
      this._onConnected();
    }
  }

  _on_peer_open() {
    this._connection = this._peer.connect(getRoomCodePeerId(this._roomCode));
    this._connection.on('open', this._on_connection_open.bind(this));
    this._connection.on('error', this._on_connection_error.bind(this));
  }

  _on_peer_error(err) {
    const closeAndError = msg => {
      this.leave();
      if (typeof this._onFailure === 'function') {
        this._onFailure(msg);
      }
    }

    this._peer.destroy();
    switch (err.type) {
      case 'browser-incompatible':
        closeAndError('Browser is incompatible and cannot make connections.');
        break;
      case 'ssl-unavailable':
        closeAndError('Cannot securely connect to server.');
        break;
      case 'peer-unavailable':
        closeAndError('Could not find room with code ' + this._roomCode);
        break;
      default:
        closeAndError('Could not connect to room, possibly due to a network error.');
        break;
    }
  }

  _on_connection_open() {
    // No need to stay connected to PeerServer once a connection is made.
    this._peer.disconnect();
    this._connection.on('close', this._on_connection_close.bind(this));
    this._connection.on('data', this._on_connection_data.bind(this));
    // Send a USERNAME packet to request a username.
    // This is only performed when the connection is first established.
    this.send(new DataPacket(DataPacket.USERNAME, this.username));
  }

  _on_connection_close() {
    this._peer.destroy();
    clearInterval(this._pingInterval);
    if (typeof this._onFailure === 'function') {
      this._onFailure('Connection to host was lost.');
    }
  }

  _on_connection_error(err) {
    console.log('CLIENT: connection error:', err);
    this._peer.destroy();
    clearInterval(this._pingInterval);
    if (typeof this._onFailure === 'function') {
      this._onFailure('Unexpected error with connection to room.');
    }
  }

  _on_connection_data(data) {
    console.log('CLIENT: received', JSON.stringify(data, null, 1));
    // Handle different types of data packets.
    const dataPacket = DataPacket.parse(data);
    switch (dataPacket.type) {
      case DataPacket.PING: {
        this._lastPing = Date.now();
        break;
      }
      // ASSUMPTION:
      // This is only ever reached once.
      case DataPacket.USERNAME: {
        this.username = dataPacket.content;
        this._on_successfully_joined();
        break;
      }
    }
  }
}