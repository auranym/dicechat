/**
 * Contains information about a message that is displayed in
 * and rendered by a chat component.
 * 
 * In a model-view-controller pattern, this class is analygous to
 * the model and the chat component is the view.
 */
export default class Message {
  /**
   * Main content of the message. Required.
   */
  content;
  /**
   * (Optional) The username to be displayed before the content.
   * Omit if this is not a user message.
   */
  username;
  /**
   * (Optional) Indicates whether the message should be rendered as
   * a "block" in the chat. A "block" is reserved for special messages,
   * usually indicative of a command being performed. This is not
   * used if `username` is defined.
   */
  renderAsBlock;

  /**
   * @param {*} strData Stringified Message sent over a PeerJS connection.
   * @return {Message} A parsed message.
   */
  static parse(strData) {
    const parsedStr = JSON.parse(strData);
    return new Message(parsedStr.c, { username: parsedStr.u, renderAsBlock: parsedStr.b });
  }

  /**
   * @returns {string} Stringified Message instance, for sending over a PeerJS connection.
   */
  toString() {
    return JSON.stringify({
      u: this.username,
      c: this.content,
      b: this.renderAsBlock
    });
  }

  /**
   * @param {string} content 
   * @param {object} configs 
   * @param {string} configs.username
   * @param {boolean} configs.renderAsBlock
   */
  constructor(content, { username, renderAsBlock = false } = {}) {
    this.content = content;
    this.username = username;
    this.renderAsBlock = renderAsBlock;
  }
}