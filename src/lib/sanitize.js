import DOMPurify from 'dompurify';
import escapeHTML from 'escape-html';

/**
 * @param {string} str 
 * @returns A sanitized and safe string to be injected into the DOM.
 */
export default function(str) {
  return DOMPurify.sanitize(escapeHTML(str));
}