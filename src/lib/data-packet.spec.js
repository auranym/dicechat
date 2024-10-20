import { describe, expect, test } from 'vitest';
import DataPacket from './data-packet';

describe('parse', () => {
  test('returns NONE packet when data is not an object', () => {
    expect(DataPacket.parse(null)?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse(undefined)?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse(false)?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse(true)?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse('string')?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse(123)?.type).toBe(DataPacket.NONE);
  });

  test('returns NONE when packet does not have a type', () => {
    expect(DataPacket.parse({})?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse([])?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse({ foo: 'bar' })?.type).toBe(DataPacket.NONE);
  });

  test('returns NONE when packet has an unknown type', () => {
    expect(DataPacket.parse({ type: 'unknown' })?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse({ type: 123456789 })?.type).toBe(DataPacket.NONE);
  });

  test('correctly parses data', () => {
    expect(DataPacket.parse({ type: DataPacket.NONE })?.type).toBe(DataPacket.NONE);
    expect(DataPacket.parse({ type: DataPacket.PING })?.type).toBe(DataPacket.PING);
    expect(DataPacket.parse({
      type: DataPacket.MESSAGE,
      content: 'foobar'
    })).toMatchObject(new DataPacket(DataPacket.MESSAGE, 'foobar'));
  });
});

describe('constructor', () => {
  test('returns NONE when type is unknown', () => {
    expect(new DataPacket('foobar')?.type).toBe(DataPacket.NONE);
    expect(new DataPacket(123456789)?.type).toBe(DataPacket.NONE);
  });

  test('creates DataPacket with valid type (not content)', () => {
    expect(DataPacket.parse({
      type: DataPacket.MESSAGE
    })).toMatchObject(new DataPacket(DataPacket.MESSAGE));
    expect(DataPacket.parse({
      type: DataPacket.MESSAGE,
      content: {}
    })).toMatchObject(new DataPacket(DataPacket.MESSAGE));
  });

  test('creates DataPacket with valid parameters', () => {
    expect(DataPacket.parse({
      type: DataPacket.MESSAGE,
      content: 'foobar'
    })).toMatchObject(new DataPacket(DataPacket.MESSAGE, 'foobar'));
  });
});