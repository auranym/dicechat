import { Command, Message } from '../lib';

const regex = /([^ ]+) (.*)/;

export default new Command({
  name: 'whisper',
  description: 'Send a private message.<br/>Usage: "/whisper user message"',
  invalidMessage: 'Incorrect usage of whisper.<br/>Usage: "/whisper user message"',
  validator: (arg, username, host) => {
    // Get username then remaining message.
    // If RegEx is not matched, then the command is invalid.
    const matches = arg.match(regex);
    if (matches === null) {
      return false;
    }

    // If we reach here, then check if the user is in the room
    // and if the user is not trying to whisper to themself.
    const user = matches[1];
    return (
      user !== username
      && (host.getUsername() === user || host.getUsernames().includes(user))
    );
  },
  targeter: (arg, username, host) => {
    // If we reach here, it's safe to assume that the command
    // is valid and the whispered user is in the room.
    return [username, arg.match(regex)[1]];
  },
  applier: (arg, username, host) => {
    const [, target, message] = arg.match(regex);
    return new Message(message, { username: `(whisper) ${username} to ${target}` });
  }
});