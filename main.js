import './main.css';
import '@fontsource-variable/quicksand';
import { Client, Host, Message, showAlert, hideAlert } from './src/lib';

/**
 * Called when Home component connects to a room or sets up a room.
 * This should be used to swap the main component to a Room instead of
 * a Home.
 * @param {*} obj Client or Host instance, depending on user interaction.
 */
function onHomeReady(obj) {

  // Set callbacks and create room for a Host.
  if (obj instanceof Host) {
    obj.onFailure = onFailure;
    obj.onMessage = (username, message) => onHostMessage(obj, username, message);
    obj.onJoin = username => onHostJoin(obj, username);
    obj.onLeave = username => onHostLeave(obj, username);
    
    hideAlert();

    const room = showRoom();
    room.setAttribute('host', obj.getUsername());
    room.setAttribute('code', obj.getRoomCode());
    room.onSend = message => onHostRoomSend(obj, message);
  }

  // Set callbacks and create room for a Client.
  else if (obj instanceof Client) {
    obj.onFailure = onFailure;
    obj.onMessage = message => onClientMessage(obj, message);

    hideAlert();

    const room = showRoom();
    room.setAttribute('host', obj.getHostUsername());
    room.setAttribute('code', obj.getRoomCode());
    room.onSend = message => onClientRoomSend(obj, message);
  }

  else {
    showAlert('Cannot tell if hosting or joining. Fatal error, unknown cause.', { color: 'red' });
  }
}

/**
 * Called when a Client or Host has a fatal failure.
 * This removes the Room component, renders the Home component,
 * and shows an alert.
 * @param {string} cause Error message to show to the user.
 */
function onFailure(cause) {
  showHome();
  showAlert(cause);
}

/**
 * Callback when a client receives a message from the host.
 * @param {Client} client
 * @param {string} message Contents of the message.
 */
function onClientMessage(client, message) {
  getRoom().addMessage(Message.parse(message));
}

/**
 * Callback when the client hits the "send" button.
 * @param {Client} client
 * @param {string} message The text content being sent.
 */
function onClientRoomSend(client, message) {
  client.send(new Message(message, { username: client.getUsername() }).toString());
}

/**
 * Callback when the host receives a message from the client.
 * @param {Host} host
 * @param {string} username Username of client that sent the message.
 * @param {string} message Contents of the message.
 */
function onHostMessage(host, username, message) {
  host.send(message);
  getRoom().addMessage(Message.parse(message));
}

/**
 * Callback when a client first joins the host's room.
 * @param {Host} host
 * @param {string} username Username of client that just joined.
 */
function onHostJoin(host, username) {
  const messageObj = new Message(`${username} has joined!`);
  host.send(messageObj.toString());
  getRoom().addMessage(messageObj);
}

/**
 * Callback when a client leaves the host's room.
 * @param {Host} host
 * @param {string} username Username of client that just left. 
 */
function onHostLeave(host, username) {
  const messageObj = new Message(`${username} has left.`);
  host.send(messageObj.toString());
  getRoom().addMessage(messageObj);
}

/**
 * Callback when the host hits the "send" button.
 * @param {Host} host
 * @param {string} message The text content being sent.
 */
function onHostRoomSend(host, message) {
  const messageObj = new Message(message, { username: host.getUsername() });
  host.send(messageObj.toString());
  getRoom().addMessage(messageObj);
}

function getHome() {
  return document.querySelector('dc-home');
}

function showHome() {
  // Remove room, if it exists
  const room = getRoom();
  if (room) {
    room.remove();
  }

  const home = document.createElement('dc-home');
  home.onReady = onHomeReady;
  document.body.appendChild(home);

  return home;
}

function getRoom() {
  return document.querySelector('dc-room');
}

function showRoom() {
  // Remove home, if it exists
  const home = getHome();
  if (home) {
    home.remove();
  }

  const room = document.createElement('dc-room');
  document.body.appendChild(room);

  return room;
}

// Set up the app!
document.body.onload = () => {
  showHome();
};