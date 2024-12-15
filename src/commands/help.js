import { Command } from '../lib';
import commands from '.';

export default new Command({
  name: 'help',
  description: 'Show a list of commands and their descriptions.',
  invalidMessage: '',
  // Always valid.
  targeter: (arg, username, host) => [username],
  applier: () => /* html */`
    <div class="mar-v-sm">
      <h2 class="h4">List of commands:</h2>
      <ul>
        ${Object.values(commands).map(command => /* html */`<li style="word-break: unset"><b>/${command.name}:</b> ${command.description}</li>`).join('')}
      </ul>
    </div>
  `
});
