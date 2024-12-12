import { describe, expect, test } from 'vitest';
import Message from './message';

describe('toString and parse', () => {
  test('correctly encodes/decodes a Message to/from a string', () => {
    let message = new Message('foo');
    let messageStr = message.toString();
    expect(messageStr).toBeTypeOf('string');
    expect(Message.parse(messageStr)).toMatchObject(message);

    message = new Message('bar', { username: 'baz', renderAsBlock: true });
    messageStr = message.toString();
    expect(messageStr).toBeTypeOf('string');
    expect(Message.parse(messageStr)).toMatchObject(message);
  });
});

describe('constructor', () => {
  test('correctly returns instance of Message', () => {
    let message = new Message('foo');
    expect(message.content).toBe('foo');
    expect(message.username).toBe(undefined);
    expect(message.renderAsBlock).toBe(false);

    message = new Message('bar', { username: 'baz', renderAsBlock: true });
    expect(message.content).toBe('bar');
    expect(message.username).toBe('baz');
    expect(message.renderAsBlock).toBe(true);
  });
});