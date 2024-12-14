import { describe, expect, test } from 'vitest';
import Command from './command';

describe('getCommand', () => {
  test('returns null when input not a command format', () => {
    expect(Command.getCommand('')).toBe(null);
    expect(Command.getCommand('foo')).toBe(null);
    expect(Command.getCommand('123')).toBe(null);
    expect(Command.getCommand('/ foo')).toBe(null);
    expect(Command.getCommand('/123')).toBe(null);
    expect(Command.getCommand('./foo')).toBe(null);
    expect(Command.getCommand('foo bar /baz qux')).toBe(null);
  });

  test('returns the command string when input is a command format', () => {
    expect(Command.getCommand('/foo')).toBe('foo');
    expect(Command.getCommand('/foo bar baz')).toBe('foo');
    expect(Command.getCommand('/FOO')).toBe('foo');
    expect(Command.getCommand('/FoOoOoO')).toBe('foooooo');
  });
});

describe('getArg', () => {
  test('correctly returns command argument', () => {
    expect(Command.getArg('/foo')).toBe('');
    expect(Command.getArg('/foo bar baz')).toBe('bar baz');
    expect(Command.getArg('/foo    bar baz')).toBe('   bar baz');
  });
})