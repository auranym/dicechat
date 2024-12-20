import { Command } from '../lib';

export default new Command({
  name: 'me',
  description: 'Announce something about yourself.',
  invalidMessage: '',
  // Always valid.
  // Target all users.
  applier: (arg, username, host) => `${username} ${arg}`
});
