module.exports = function pipe(stream, tubes) {
  tubes = tubes || stream.slice(1);
  return tubes.reduce(function(stream, tube) { return stream.pipe(tube); }, Array.isArray(stream) ? stream[0] : stream);
};