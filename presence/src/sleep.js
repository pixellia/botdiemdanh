/**

 * @param {number} ms miliseconds to wait
 * @returns
 */
module.exports = function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
