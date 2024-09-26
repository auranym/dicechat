import './main.css';
import '@fontsource-variable/quicksand';
import { DiceRoll } from '@dice-roller/rpg-dice-roller';

document.getElementById("roller").onclick = () => {
  const roll = new DiceRoll("1d6");
  document.getElementById("result").innerText = roll.total;
}