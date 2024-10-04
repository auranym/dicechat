import { describe, expect, test } from 'vitest';
import { validateRoomCode, generateRoomCode, getRoomCodePeerId } from './room-code';
import { ROOM_CODE_PEER_ID } from '../constants';

describe('validateRoomCode', () => {
  test('returns false if room code param is not a string', () => {
    expect(validateRoomCode(null)).toBe(false);
    expect(validateRoomCode(true)).toBe(false);
    expect(validateRoomCode(123)).toBe(false);
    expect(validateRoomCode([])).toBe(false);
    expect(validateRoomCode({})).toBe(false);
  });

  test('returns false if room code is not 6 capital letters', () => {
    expect(validateRoomCode('')).toBe(false);
    expect(validateRoomCode('foo')).toBe(false);
    expect(validateRoomCode('123456')).toBe(false);
    expect(validateRoomCode('FOOBARRR')).toBe(false);
  });

  test('returns true if room code is 6 capital letters', () => {
    expect(validateRoomCode('FOOBAR')).toBe(true);
    expect(validateRoomCode('AAAAAA')).toBe(true);
  });
});

describe('generateRoomCode', () => {
  test('returns a 6-character string', () => {
    expect(generateRoomCode().length).toBe(6);
  });

  test('returns a string of only capital letters', () => {
    expect(generateRoomCode()).toMatch(/^([A-Z]){6}$/);
  });
});

describe('getRoomCodePeerId', () => {
  test('correctly returns room code followed by room code peer ID constant', () => {
    const roomCode = generateRoomCode();
    expect(getRoomCodePeerId(roomCode)).toBe(`${roomCode}-${ROOM_CODE_PEER_ID}`);
  });
});