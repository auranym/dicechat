import './main.css';
import '@fontsource-variable/quicksand';
import { Client, Host, Command, showAlert, hideAlert } from './src/lib';
import commands from './src/commands';

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
    const roomCode = obj.getRoomCode()
    room.setAttribute('host', obj.getUsername());
    room.setAttribute('code', roomCode);
    room.onSend = message => onHostRoomSend(obj, message);
    room.onLeave = () => obj.close();
    // Show host welcome message.
    room.addMessage( /* html */`
      <div class="text-centered mar-v-sm">
        Welcome to your DiceChat room!<br/>
        Type "/help" to see a list of commands.
        <br/><br/>
        Your room code is <b>${roomCode}</b>.
      </div>`
    );
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
    room.onLeave = () => obj.leave();
    // Show client welcome message.
    room.addMessage( /* html */`
      <div class="text-centered mar-v-sm">
        Welcome to the DiceChat room!<br/>
        Type "/help" to see a list of commands.
      </div>`
    );
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
  getRoom().addMessage(message);
}

/**
 * Callback when the client hits the "send" button.
 * @param {Client} client
 * @param {string} message The text content being sent.
 */
function onClientRoomSend(client, message) {
  // Forward along to the host for parsing and formatting.
  // The message to be displayed will be received back from
  // the host.
  client.send(message);
}

/**
 * Callback when the host receives a message from the client.
 * @param {Host} host
 * @param {string} username Username of client that sent the message.
 * @param {string} message Contents of the message.
 */
function onHostMessage(host, username, message) {
  // First check if the message is a command.
  const commandName = Command.getCommand(message);
  
  // If so, then try to do the command.
  if (commandName != null) {

    // First check that is actually *is* a command.
    const command = commands[commandName];
    if (!(command instanceof Command)) {
      // If not, send invalid command message to the sender.
      host.send('Invalid command. Type /help for a list of commands.', [username]);
      return;
    }

    // If we reach here, the command exists.
    // So now validate that it is being used correctly
    const commandArg = Command.getArg(message);
    if (
      typeof command.validator === 'function'
      && !command.validator(commandArg, username, host)
    ) {
      // If used incorrectly, say so.
      host.send(command.invalidMessage, [username]);
      return;
    }

    // Finally, if we reach here, the command is valid.
    const commandTargets = typeof command.targeter === 'function'
      ? command.targeter(commandArg, username, host)
      : undefined;
    const commandMessage = command.applier(commandArg, username, host);
    host.send(commandMessage, commandTargets);
    // Also show in the host's chat if applicable.
    if (!commandTargets || commandTargets.includes(host.getUsername())) {
      getRoom().addMessage(commandMessage);
    }
  }

  // If *not* a command, perform like a regular message.
  else {
    const messageStr = /* html */`<b>${username}:</b> ${message}`;
    host.send(messageStr);
    getRoom().addMessage(messageStr);
  }
}

/**
 * Callback when a client first joins the host's room.
 * @param {Host} host
 * @param {string} username Username of client that just joined.
 */
function onHostJoin(host, username) {
  const message = `${username} has joined!`;
  host.send(message);
  getRoom().addMessage(message);
}

/**
 * Callback when a client leaves the host's room.
 * @param {Host} host
 * @param {string} username Username of client that just left. 
 */
function onHostLeave(host, username) {
  const message = `${username} has left.`;
  host.send(message);
  getRoom().addMessage(message);
}

/**
 * Callback when the host hits the "send" button.
 * @param {Host} host
 * @param {string} message The text content being sent.
 */
function onHostRoomSend(host, message) {
  const username = host.getUsername();
  // First check if the message is a command.
  const commandName = Command.getCommand(message);
  // If so, then try to do the command.
  if (commandName != null) {

    // First check that is actually *is* a command.
    const command = commands[commandName];
    if (!(command instanceof Command)) {
      // If not, send invalid command message to the sender.
      getRoom().addMessage('Invalid command. Type /help for a list of commands.');
      return;
    }

    // If we reach here, the command exists.
    // So now validate that it is being used correctly
    const commandArg = Command.getArg(message);
    if (
      typeof command.validator === 'function'
      && !command.validator(commandArg, username, host)
    ) {
      // If used incorrectly, say so.
      getRoom().addMessage(command.invalidMessage);
      return;
    }

    // Finally, if we reach here, the command is valid.
    const commandTargets = typeof command.targeter === 'function'
      ? command.targeter(commandArg, username, host)
      : undefined;
    const commandMessage = command.applier(commandArg, username, host);
    // Send if command targets are not only the host
    if (!commandTargets || !(commandTargets.length === 1 && commandTargets[0] === username)) {
      host.send(commandMessage, commandTargets);
    }
    // Also show in the host's chat if applicable.
    if (!commandTargets || commandTargets.includes(host.getUsername())) {
      getRoom().addMessage(commandMessage);
    }
  }
  
  // If *not* a command, perform like a regular message.
  else {
    const messageStr = /* html */`<b>${username}:</b> ${message}`;
    host.send(messageStr);
    getRoom().addMessage(messageStr);
  }
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