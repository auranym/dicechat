import { DiceRoll } from '@dice-roller/rpg-dice-roller';
import { Command, Message } from '../lib';

const anchor = text => `<a href="https://dice-roller.github.io/documentation/guide/notation/" target="_blank">${text}</a>`

export default new Command({
  name: 'roll',
  description: `
    Roll dice using dice notation. For example, "/roll 1d6".<br/>
    Read more about options ${anchor('here')} (opens a new tab).
  `,
  invalidMessage: `Invalid use of /roll. See valid rolls ${anchor('here')} (opens a new tab).`,
  validator: (arg, username, host) => {
    try {
      const roll = new DiceRoll(arg);
      return Boolean(roll);
    } catch(e) {
      return false;
    }
  },
  // Targets everyone.
  applier: (arg, username, host) => {
    const roll = new DiceRoll(arg);
    return new Message( /* html */`
    <div class="text-centered">
      ${username} rolled ${roll.notation}:<br/>
      ${roll.rolls.join(' ')} = <b>${roll.total}</b>
    </div>
    `, {
      renderAsBlock: true
    });
  }
})