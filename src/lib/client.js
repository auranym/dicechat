import { Peer } from 'peerjs';
import { getRoomCodePeerId, validateRoomCode } from './room-code';

export default class Client {
  // Private properties
  _roomCode;
  _peer;
  _connection;

  /**
   * Sets up a client for an existing room. If the client could not connect,
   * this object is invalidated.
   * @param {string} roomCode
   */
  constructor(roomCode) {
    // Make sure there is a room code
    if (!validateRoomCode(roomCode)) {
      console.error('RoomClient could not be created. Missing/invalid room code from constructor.');
      return;
    }

    this._roomCode = roomCode;
    this._peer = new Peer();
    // RoomClients do not listen for connections,
    // so there is no need to have a callback for 'connection'.
    this._peer.on('open', this._on_peer_open.bind(this));
    this._peer.on('close', this._on_peer_close.bind(this));
    this._peer.on('error', this._on_peer_error.bind(this));
  }

  /**
   * Sends a message to the RoomHost, to be displayed in the RoomChat.
   * This function does not cause the message to be displayed immediately,
   * as it first must reach the RoomHost, where it is also sanitized.
   * @param {string} message Message being sent.
   */
  send(message) {
    console.log('CLIENT: sending', JSON.stringify(message, null, 1));
    this._connection.send(message);
  }

  /**
   * Leaves the room that this object is connected to.
   * Causes this object to be invalidated.
   */
  leave() {
    this._peer.destroy();
  }

  _on_peer_open(id) {
    console.log('CLIENT: My peer ID is: ' + id);
    console.log('CLIENT: Connecting to', getRoomCodePeerId(this._roomCode));
    this._connection = this._peer.connect(getRoomCodePeerId(this._roomCode));
    this._connection.on('open', this._on_connection_open.bind(this));
    this._connection.on('close', this._on_connection_close.bind(this));
    this._connection.on('error', this._on_connection_error.bind(this));
  }

  _on_peer_close() {
    console.log('CLIENT: Closed');
  }

  _on_peer_error(err) {
    console.log('CLIENT: Error:', err.type);
    this._peer.destroy();
  }

  _on_connection_open() {
    console.log('CLIENT: Connection open');
    // No longer need connection to the PeerServer.
    this._peer.disconnect();
    this._connection.on('data', this._on_connection_data.bind(this));
  }

  _on_connection_close() {
    console.log('CLIENT: Connection closed');
    this._peer.destroy();
  }

  _on_connection_data(data) {
    console.log('CLIENT: received', JSON.stringify(data, null, 1));
  }

  _on_connection_error(err) {
    console.log('CLIENT: connection error:', err);
    this._peer.destroy();
  }
}