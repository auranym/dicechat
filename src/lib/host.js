import { Peer } from 'peerjs';
import { generateRoomCode, getRoomCodePeerId, validateRoomCode } from './room-code';
import DataPacket from './data-packet';
import sanitize from './sanitize';

export default class Host {
  // Public properties
  // (callbacks)
  onOpen;
  onFailure;
  onMessage;
  onJoin;
  onLeave;

  // Private properties
  _username;
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
   * @param {function} configs.onMessage
   * Callback when a message is received from the host. Passes a two string parameters: username and message.
   * @param {function} configs.onJoin
   * Callback when a client joins the room. Passes the username of the client as the parameter.
   * @param {function} configs.onLeave
   * Callback when a client leaves the room. Passes the username of the client as the parameter.
  */
  constructor({ username, onOpen, onFailure, onMessage, onJoin, onLeave }) {
    // This *should* have been done already, but just in case,
    // sanitize the username again and check that it is
    // a non-empty string.
    this._username = sanitize(username ?? '');
    if (this._username === '') {
      if (typeof onFailure === 'function') {
        onFailure('Host username is invalid.');
      }
      return;
    }

    // Assign properties
    this.onOpen = onOpen;
    this.onFailure = onFailure;
    this.onMessage = onMessage;
    this.onJoin = onJoin;
    this.onLeave = onLeave;
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
   * Sends a message to all clients in the room.
   * @param {string} message 
   * @param {string[]} usernames (Optional) Who to send the message to.
   */
  send(message, usernames = undefined) {
    // Usually, messages will be sent to all users.
    if (usernames === undefined) {  
      this._send_packet(new DataPacket(DataPacket.MESSAGE, message));
    }
    // If there are specific users, find their objects in _clients.
    else {
      // DEV NOTE:
      // This can definitely be optimized, since it's O(n).
      // Some solution maybe could be to keep a map of username->client.
      // But for now, I won't be doing that.
      this._send_packet(
        new DataPacket(DataPacket.MESSAGE, message), 
        Object.values(this._clients).filter(client => usernames.includes(client.username))
      );
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
    if (typeof this.onFailure === 'function') {
      this.onFailure('Room was closed.');
    }
  }

  /**
   * @returns {string} The room code for this host room.
   */
  getRoomCode() {
    return this._roomCode;
  }

  /**
   * @returns {string} The username of this host.
   */
  getUsername() {
    return this._username;
  }

  /**
   * @returns {string[]} Usernames of currently connected clients.
   */
  getUsernames() {
    return Object.values(this._clients).reduce((usernames, client) => {
      const username = client.username;
      if (typeof username === 'string')
        return [...usernames, username];
      else
        return [...usernames];
    }, []);
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
      [this._username]: true
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

  /**
   * Sends a data packet to all clients in the room.
   * This function sanitizes content and also performs any
   * commands associated with the message.
   * @param {DataPacket} dataPacket Message being sent.
   * @param {object[]} clients (Optional) Which clients to send the message to. If omitted, all clients will be used.
   */
  _send_packet(dataPacket, clients = undefined) {
    if (dataPacket.content) { 
      dataPacket.content = dataPacket.content;
    }
    for (const client of (clients ?? Object.values(this._clients))) {
      if (client.connection.open) {
        client.connection.send(dataPacket);
      }
    }
  }

  _on_peer_open() {
    // If we reach here, then the room code was valid!
    this._peer.on('connection', this._on_peer_connection.bind(this));
    if (typeof this.onOpen === 'function') {
      this.onOpen(this._roomCode);
    }
    
    // Ping clients every now and then
    // and check for pings back from the client.
    this._pingInterval = setInterval(() => {
      this._send_packet(new DataPacket(DataPacket.PING));
      for (const client of Object.values(this._clients)) {
        if (client.connection.open && Date.now() - client.lastPing > 5000) {
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
    this._clients[peerId] = { connection };
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
      if (typeof this.onFailure === 'function') {
        this.onFailure(fatalErrorMessage);
      }
    }
    // Try setting up again if unavailableId was not fatal.
    else if (unavailableId) {
      this._setup();
    }
  }

  _on_connection_open(peerId) {
    this._clients[peerId].lastPing = Date.now();
    this._clients[peerId].connection.on('data', this._on_connection_data.bind(this, peerId));
  }

  _on_connection_close(peerId) {
    if (
      typeof this.onLeave === 'function'
      && typeof this._clients[peerId].username === 'string'
    ) {
      this.onLeave(this._clients[peerId].username);
    }
    delete this._clients[peerId];
  }

  _on_connection_error(id, err) {
    console.log('HOST: connection error from', id, ':', err);
  }
  
  _on_connection_data(id, data) {
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
      // to the requested username, which is sent back to the client
      // along with the host's username.
      case DataPacket.USERNAME: {
        this._clients[id].username = this._get_new_safe_username(dataPacket.content);
        this._clients[id].connection.send(
          new DataPacket(DataPacket.USERNAME, JSON.stringify({
            c: this._clients[id].username,
            h: this._username
        })));
        // If we reach here, then the client is successfully connected and ready
        // to send and receive messages.
        if (typeof this.onJoin === 'function') {
          this.onJoin(this._clients[id].username);
        }
        break;
      }
      case DataPacket.MESSAGE: {
        if (typeof this.onMessage === 'function') {
          this.onMessage(this._clients[id].username, dataPacket.content);
        }
        break;
      }
    }
  }
}