import { ROOM_CODE_PEER_ID } from "../constants";

/**
 * 
 * @param {*} code Room code variable to be validated.
 * @returns {boolean} `true` if `code` is a 6-character string made of capital letters.
 */
export function validateRoomCode(code) {
  return (
    typeof code === 'string' &&
    /^([A-Z]){6}$/.test(code)
  );
}

// Ommitted "I" from letter options.
const letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
/**
 * @returns {string} 6-character string made of capital letters.
 */
export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code = code + letters.at(Math.floor(Math.random() * letters.length));
  }
  return code;
}

/**
 * @param {string} code A valid room code.
 * @returns {string} A PeerJS ID string, used for establishing connections.
 */
export function getRoomCodePeerId(code) {
  return `${code}-${ROOM_CODE_PEER_ID}`;
}