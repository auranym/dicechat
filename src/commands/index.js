import help from './help';
import roll from './roll';
import me from './me';
import whisper from './whisper';

/**
 * Object that maps a command name to the respective Command object.
 * @type {object}
 */
export default ({
  // Add commands similarly to below.
  // Make sure that commands do not have overlapping names!
  [help.name]: help,
  [roll.name]: roll,
  [me.name]: me,
  [whisper.name]: whisper
});
