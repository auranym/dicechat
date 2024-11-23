import { Peer } from 'peerjs';
import DOMPurify from 'dompurify';
import { generateRoomCode, getRoomCodePeerId, validateRoomCode } from './room-code';
import DataPacket from './data-packet';

export default class Host {
  // Public properties
  username;

  // Private properties
  _onOpen;
  _onFailure;
  _roomCode;
  _roomCodeTries;
  _peer;

  /**
   * Object whose keys are peer IDs and value is and object with the following properties:
   * - `connection`
   * - `username`
   * - `lastPing`
   */
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

    // Assign properties
    this._onOpen = onOpen;
    this._onFailure = onFailure;
    this._roomCodeTries = 0;
    this._clients = {};

    // Hosting a room involves the following steps,
    // after which, onOpen is called. If any step fails,
    // onFailure is called with the reason (string).
    //
    // 1. Generate a room code and attempt to create a peer using it. (_setup)
    // 2. If 2 fails because of unavailable-id, retry 1 nine more times. (_on_peer_error)
    this._setup();
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
    for (const client of Object.values(this._clients)) {
      client.connection.send(dataPacket);
    }
  }

  /**
   * Disconnects all clients and destroys the host peer.
   */
  close() {
    for (const client of Object.values(this._clients)) {
      client.connection.close();
    }
    this._peer.destroy();
    clearInterval(this._pingInterval);
    if (typeof this._onFailure === 'function') {
      this._onFailure('Room was closed.');
    }
  }

  _setup() {
    // Assume this is a number...
    this._roomCodeTries += 1;
    this._roomCode = generateRoomCode();
    this._peer = new Peer(getRoomCodePeerId(this._roomCode));
    this._peer.on('open', this._on_peer_open.bind(this));
    this._peer.on('error', this._on_peer_error.bind(this));
  }

  /**
   * Searches through current clients and checks for
   * any overlaps with `username`. If there are none,
   * then `username` is returned. If there are overlaps,
   * then a number is added to the end of the username
   * before being returned.
   * @param {string} username 
   */
  _get_new_safe_username(username) {
    const usernames = {
      [this.username]: true
    };
    for (const client of Object.values(this._clients)) {
      if (client.username) {
        usernames[client.username] = true;
      }
    }
    // This may be unsafe...
    // and it's definitely not efficient,
    // but this is app is for small groups.
    // If this becomes a problem, then rework this.
    let num = 1;
    let newUsername = username;
    while (usernames[newUsername]) {
      num += 1;
      newUsername = username + num;
    }
    return newUsername;
  }

  _on_peer_open() {
    // If we reach here, then the room code was valid!
    this._peer.on('connection', this._on_peer_connection.bind(this));
    if (typeof this._onOpen === 'function') {
      this._onOpen(this._roomCode);
    }
    
    // Ping clients every now and then
    // and check for pings back from the client.
    this._pingInterval = setInterval(() => {
      this.send(new DataPacket(DataPacket.PING));
      for (const client of Object.values(this._clients)) {
        if (Date.now() - client.lastPing > 5000) {
          // Client did not ping in 5 seconds,
          // so assume the connection has been lost.
          console.log('Did not receive ping from client in 5+ secs');
          client.connection.close();
        }
      }
    }, 2000);
  }

  _on_peer_connection(connection) {
    const peerId = connection.peer;
    console.log('HOST: Connected to client', peerId);
    this._clients[peerId] = { connection, lastPing: Date.now() };
    connection.on('open', this._on_connection_open.bind(this, peerId));
    connection.on('close', this._on_connection_close.bind(this, peerId));
    connection.on('error', this._on_connection_error.bind(this, peerId));
  }

  _on_peer_error(err) {
    console.log('HOST: Error:', err.type);
    let fatalErrorMessage;
    let unavailableId = false;
    switch (err.type) {
      // I am assuming that we only *need* to call onFailure
      // when the type is fatal, and I am also making some
      // judgement calls about which non-fatal errors are
      // fatal for this app.
      // The default case is "nothing happens"
      case 'browser-incompatible':
        fatalErrorMessage = 'Browser is incompatible and cannot make connections.';
        break;
      case 'network':
      case 'server-error':
      case 'ssl-unavailable':
        fatalErrorMessage = 'Error with connecting to the server.';
        break;
      case 'socket-error':
      case 'socket-closed':
        fatalErrorMessage = 'Error with underlying socket.';
        break;
      case 'unavailable-id':
        unavailableId = true;
        if (this._roomCodeTries >= 10) {
          fatalErrorMessage = 'Could not create a valid room code. Try again later.';
        }
        break;
    }

    this._peer.destroy();
    this._peer = null;
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }

    // Quit here if the error message is fatal
    if (fatalErrorMessage) {
      if (typeof this._onFailure === 'function') {
        this._onFailure(fatalErrorMessage);
      }
    }
    // Try setting up again if unavailableId was not fatal.
    else if (unavailableId) {
      this._setup();
    }
  }

  _on_connection_open(peerId) {
    console.log('HOST: Connection ready to use for client', peerId);
    this._clients[peerId].connection.on('data', this._on_connection_data.bind(this, peerId));
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
    // Handle different types of data packets.
    const dataPacket = DataPacket.parse(data);
    switch (dataPacket.type) {
      case DataPacket.PING: {
        this._clients[id].lastPing = Date.now();
        break;
      }
      // This case occurs when a client successfully connects to a room
      // and they request a username. The current usernames are compared,
      // and if there are any collisions, a number is appended
      // to the requested username, which is sent back to the client.
      case DataPacket.USERNAME: {
        this._clients[id].username = this._get_new_safe_username(dataPacket.content);
        this._clients[id].connection.send(
          new DataPacket(DataPacket.USERNAME, this._clients[id].username)
        );
        break;
      }
    }
  }
}