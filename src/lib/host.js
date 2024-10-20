import { Peer } from 'peerjs';
import DOMPurify from 'dompurify';
import { generateRoomCode, getRoomCodePeerId, validateRoomCode } from './room-code';
import DataPacket from './data-packet';

export default class Host {
  // Public properties
  username;

  // Private properties
  _onFailure;
  _roomCode;
  _peer;
  /** Object whose keys are peer IDs and value is the connection object. */
  _clients;
  /** Interval that pings clients. */
  _pingInterval;

  /**
   * Sets up the host for a room.
   * @param {object} configs
   * @param {string} configs.username
   * (Required) The host's username.
   * @param {function} configs.onOpen
   * Callback when the host is set up successfully. Passes a single parameter with the room code.
   * @param {function} configs.onFailure
   * Callback when the host errors or cannot be set up. Passes a single parameter with the reason for error.
   */
  constructor({ username, onOpen, onFailure }) {
    // This *should* have been done already, but just in case,
    // sanitize the username again and check that it is
    // a non-empty string.
    this.username = DOMPurify.sanitize(username ?? '');
    if (this.username === '') {
      if (typeof onFailure === 'function') {
        onFailure('Host username is invalid.');
      }
      return;
    }

    // Generate room code and set up Peer.
    // If there is a room code conflict, try again
    // with a max of 10 attempts.
    new Promise(async (resolve, reject) => {
      // Generate a room code and init tries.
      let roomCode = generateRoomCode(),
        peer = null,
        tries = 0,
        fatalErrorMessage = '';
      
      // Attempt to set up the Peer and await
      // for open connection or error.
      while (tries < 10 && !fatalErrorMessage && !peer) {
        tries += 1;
        peer = new Peer(getRoomCodePeerId(roomCode));
        await new Promise(resolve => {
          peer.on('open', resolve);
          peer.on('error', err => {
            switch (err.type) {
              case 'browser-incompatible':
                fatalErrorMessage = 'Browser is incompatible and cannot make connections.';
                break;
              case 'ssl-unavailable':
                fatalErrorMessage = 'Cannot securely connect to server.';
                break;
              case 'unavailable-id':
                roomCode = generateRoomCode();
                break;
            }
            peer.destroy();
            peer = null;
            resolve();
          });
        });
      }
      // After while loop, resolve or reject.
      if (fatalErrorMessage) {
        reject(fatalErrorMessage);
      }
      else if (!peer) {
        reject('Unable to create a room. The server could not be reached or a room code could not be generated.');
      }
      else {
        resolve({ roomCode, peer });
      }
    }).then(({ roomCode, peer }) => {
      this._onFailure = onFailure;
      this._roomCode = roomCode;
      this._peer = peer;
      this._clients = {};
      this._peer.on('connection', this._on_peer_connection.bind(this));
      this._peer.on('error', this._on_peer_error.bind(this));
      if (typeof onOpen === 'function') {
        onOpen(roomCode);
      }
      // Ping clients every now and then
      this._pingInterval = setInterval(() => {
        this.send(new DataPacket(DataPacket.PING));
      }, 2000);
    }).catch(reason => {
      if (typeof onFailure === 'function') {
        onFailure(reason);
      }
    });
  }

  /**
   * Sends a data packet to the room to be displayed in the RoomChat
   * for all users.
   * This function sanitizes content and also performs any
   * commands associated with the message.
   * @param {DataPacket} dataPacket Message being sent.
   */
  send(dataPacket) {
    if (dataPacket.content) { 
      dataPacket.content = DOMPurify.sanitize(dataPacket.content);
    }
    console.log('HOST: sending to group:', JSON.stringify(dataPacket, null, 1));
    for (const connection of Object.values(this._clients)) {
      connection.send(dataPacket);
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
    clearInterval(this._pingInterval);
    if (typeof this._onFailure === 'function') {
      this._onFailure('Room was closed.');
    }
  }

  _on_peer_connection(connection) {
    const peerId = connection.peer;
    console.log('HOST: Connected to client', peerId);
    this._clients[peerId] = connection;
    connection.on('open', this._on_connection_open.bind(this, peerId));
    connection.on('close', this._on_connection_close.bind(this, peerId));
    connection.on('error', this._on_connection_error.bind(this, peerId));
  }

  _on_peer_error(err) {
    console.log('HOST: Error:', err.type);
    this._peer.destroy();
    clearInterval(this._pingInterval);
    if (typeof this._onFailure === 'function') {
      this._onFailure(err.type);
    }
  }

  _on_connection_open(peerId) {
    console.log('HOST: Connection ready to use for client', peerId);
    this._clients[peerId].on('data', this._on_connection_data.bind(this, peerId));
  }

  _on_connection_close(peerId) {
    console.log('HOST: Connection closed for client', peerId);
    delete this._clients[peerId];
  }

  _on_connection_error(id, err) {
    console.log('HOST: connection error from', id, ':', err);
  }
  
  _on_connection_data(id, data) {
    console.log('HOST: received from', id, ':', JSON.stringify(data, null, 1));
  }
}