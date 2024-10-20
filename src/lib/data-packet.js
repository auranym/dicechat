export default class DataPacket {
  // Types of packets
  static get NONE() { return 0; };
  static get PING() { return 1; };
  static get MESSAGE() { return 2; };
  static get USERNAME() { return 3; };

  /**
   * @param {*} data Data packet sent over a PeerJS connection.
   * @returns {DataPacket} A parsed data packet
   */
  static parse(data) {
    // Validate that data can be parsed.
    if (!(data && typeof data === 'object')) {
      return new DataPacket(DataPacket.NONE);
    }

    // Extract and validate properties.
    const { type, content } = data;
    if (DataPacket.isValidType(type)) {
      return new DataPacket(type, typeof content === 'string' ? content : undefined);
    }
    else {
      return new DataPacket(DataPacket.NONE);
    }
  }

  static isValidType(type) {
    if (typeof type === 'number') {
      switch (type) {
        case DataPacket.NONE:
        case DataPacket.PING:
        case DataPacket.MESSAGE:
        case DataPacket.USERNAME:
          return true;
        default:
          return false;
      }
    }
    else {
      return false;
    }
  }

  /**
   * Type of data packet being sent.
   * @type {number}
   */
  type;
  /**
   * Content sent over with the packet. (Optional)
   * @type {string | undefined}
   */
  content;

  /**
   * Representation of a data packet being sent between host and clients.
   * @param {number} type 
   * @param {string | undefined} content 
   */
  constructor(type, content = undefined) {
    if (DataPacket.isValidType(type)) {
      this.type = type;
      if (typeof content === 'string') {
        this.content = content;
      }
      }
    else {
      this.type = DataPacket.NONE;
    }
  }
}