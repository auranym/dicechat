import { Peer } from 'peerjs';
import DOMPurify from 'dompurify';
import { getRoomCodePeerId, validateRoomCode } from './room-code';

export default class RoomHost {
  // Private properties
  _roomCode;
  _peer;
  // Object whose keys are peer IDs and value is the connection object.
  _clients;

  constructor(roomCode) {
    // TODO generate room code in this constructor.

    // Make sure there is a room code
    if (!validateRoomCode(roomCode)) {
      console.error('RoomHost could not be created. Missing/invalid room code from constructor.');
      return;
    }

    this._roomCode = roomCode;
    this._clients = {};
    this._peer = new Peer(getRoomCodePeerId(this._roomCode));
    this._peer.on('open', this._on_peer_open.bind(this));
    this._peer.on('connection', this._on_peer_connection.bind(this));
    this._peer.on('close', this._on_peer_close.bind(this));
    this._peer.on('error', this._on_peer_error.bind(this));
  }

  /**
   * Sends a message to the room to be displayed in the RoomChat
   * for all users.
   * This function sanitizes the message and also performs any
   * commands associated with the message.
   * @param {string} message Message being sent.
   */
  send(message) {
    console.log('HOST: sending to group:', JSON.stringify(DOMPurify.sanitize(message), null, 1));
    for (const connection of Object.values(this._clients)) {
      connection.send(DOMPurify.sanitize(message));
    }
  }

  /**
   * Disconnects all clients and destroys the host peer.
   */
  close() {
    for (const connection of Object.values(this._clients)) {
      connection.close();
    }
    this._peer.destroy();
  }

  _on_peer_open(id) {
    console.log('HOST: My peer ID is: ' + id);
  }

  _on_peer_connection(connection) {
    const peerId = connection.peer;
    console.log('HOST: Connected to client', peerId);
    this._clients[peerId] = connection;
    connection.on('open', this._on_connection_open.bind(this, peerId));
    connection.on('close', this._on_connection_close.bind(this, peerId));
    connection.on('error', this._on_connection_error.bind(this, peerId));
  }

  _on_peer_close() {
    console.log('HOST: Closed');
  }

  _on_peer_error(err) {
    console.log('HOST: Error:', err.type);
    this._peer.destroy();
  }

  _on_connection_open(peerId) {
    console.log('HOST: Connection ready to use for client', peerId);
    this._clients[peerId].on('data', this._on_connection_data.bind(this, peerId));
  }

  _on_connection_close(peerId) {
    console.log('HOST: Connection closed for client', peerId);
    delete this._clients[peerId];
  }

  _on_connection_data(id, data) {
    console.log('HOST: received from', id, ':', JSON.stringify(data, null, 1));
  }

  _on_connection_error(id, err) {
    console.log('HOST: connection error from', id, ':', err);
  }
}