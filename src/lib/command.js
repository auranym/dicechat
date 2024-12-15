/**
 * Class for a chat command (which are messages that begin with "/"
 * and do something special).
 * 
 * Commands may have an argument. This is any text that follows the command
 * and a space character. For example, the command `/roll 1d6` has the
 * argument `1d6`.
 */
export default class Command {
  /**
   * Name of the command, used immediately after "/".
   * 
   * Example: `/roll 1d6` has the name `roll`.
   * 
   * @type {string}
   */
  name;

  /**
   * Short description of what the command does. Used for the "help" menu.
   * 
   * @type {string}
   */
  description;

  /**
   * Short phrase that will be shown to the user when the command is used
   * incorrectly. In other words, when `validator` returns false, this
   * will be displayed.
   * 
   * @type {string}
   */
  invalidMessage;

  /**
   * (Optional)
   * Function that determines whether the command is valid.
   * Takes the command argument, the username of the user,
   * and the room's Host object as its parameters and should
   * return a boolean.
   * If omitted, then the command is always valid.
   * 
   * @type {function}
   */
  validator;

  /**
   * (Optional)
   * Function that determines who the command's output message
   * should be sent to.
   * Takes the command argument, the username of the user,
   * and the room's Host object as its parameters and should
   * return an array of usernames.
   * If omitted, the output message will be sent to all users.
   * 
   * @type {function}
   */
  targeter;

  /**
   * Main action of the command. It works by taking the command argument,
   * the username of the user, and the room's Host object as its parameters
   * and returns a string.
   * 
   * @type {function}
   */
  applier;

  /**
   * @param {object} config
   * @param {string} config.name Name of the command, used immediately after "/".
   * @param {string} config.description Short description of what the command does.
   * @param {string} config.invalidMessage Short message shown when command is used incorrectly.
   * @param {function} config.validator Validates command is being used correctly. Returns a boolean.
   * @param {function} config.targeter Determines who to show the output string to.
   * @param {function} config.applier Action of the command. Returns a string.
   */
  constructor({ name, description, invalidMessage, validator, targeter, applier }) {
    this.name = name;
    this.description = description;
    this.invalidMessage = invalidMessage;
    this.validator = validator;
    this.targeter = targeter;
    this.applier = applier;
  }

  /**
   * @param {string} message
   * @returns {string|null} The command name in the message, if it is a command. Otherwise, `null`.
   */
  static getCommand(message) {
    return message.toLowerCase().match(/^\/([A-z]+)/)?.[1] ?? null;
  }

  /**
   * @param {string} message A message in the format of a command. (See Command.isCommand.)
   * @returns {string} Argument for the command. Empty string if no arg.
   */
  static getArg(message) {
    return message.match(/^\/[A-z]+ ?(.*)/)[1];
  }
}