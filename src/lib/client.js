import { Peer } from 'peerjs';
import DOMPurify from 'dompurify';
import { getRoomCodePeerId, validateRoomCode } from './room-code';

export default class Client {
  // Public properties
  username;

  // Private properties
  _onFailure;
  _roomCode;
  _peer;
  _connection;

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
  constructor({ username, roomCode, onConnect, onFailure }) {
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

    // Attempt to connect to the room
    new Promise((resolve, reject) => {
      const peer = new Peer();
      // Await peer open and connection made.
      peer.on('open', () => {
        // Attempt to connect to the room.
        const connection = peer.connect(getRoomCodePeerId(roomCode));
        connection.on('open', () => resolve({ peer, connection }));
        connection.on('error', () => {
          peer.destroy();
          reject('Connection to host failed.')
        });
      });
      peer.on('error', err => {
        peer.destroy();
        switch (err.type) {
          case 'browser-incompatible':
            reject('Browser is incompatible and cannot make connections.');
            break;
          case 'ssl-unavailable':
            reject('Cannot securely connect to server.');
            break;
          case 'peer-unavailable':
            reject('Could not find room with code ' + roomCode);
            break;
          default:
            reject('Could not connect to room, possibly due to a network error.');
            break;
        }
      });
    }).then(({ peer, connection }) => {
      // No need to stay connected to PeerServer once a connection is made.
      peer.disconnect();
      this._onFailure = onFailure;
      this._roomCode = roomCode;
      this._peer = peer;
      this._connection = connection;
      this._connection.on('close', this._on_connection_close.bind(this));
      this._connection.on('error', this._on_connection_error.bind(this));
      this._connection.on('data', this._on_connection_data.bind(this));
      if (typeof onConnect === 'function') {
        onConnect();
      }
    }).catch(reason => {
      if (typeof onFailure === 'function') {
        onFailure(reason);
      }
    });
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
   */
  leave() {
    this._peer.destroy();
    console.log(this._connection);
  }

  _on_connection_close() {
    this._peer.destroy();
    if (typeof this._onFailure === 'function') {
      this._onFailure('Connection to host was closed.');
    }
  }

  _on_connection_data(data) {
    console.log('CLIENT: received', JSON.stringify(data, null, 1));
  }

  _on_connection_error(err) {
    console.log('CLIENT: connection error:', err);
    this._peer.destroy();
    if (typeof this._onFailure === 'function') {
      this._onFailure('Unexpected error with connection to room.');
    }
  }
}