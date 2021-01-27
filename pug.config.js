/**
 * Trims whitespaces, strips comments and newlines
 * @description dumb minifier, doesn't optimize code, and stuff, replace with glsl-minify maybe
 * @param {string} str
 * @returns minified string
 */
function glslminify(str) {
  // this trims whitespaces, strips comments, removes unnecessary newlines
  return str
    .replace(/\/\*(.|[\n\t])*\*\//g, '')
    .split('\n')
    .map((line) => {
      const trimmed = line
        .trim()
        .replace(/\s*(\W)\s*/g, '$1')
        .replace(/\/\/.*$/, '');
      // directives like #define need a newline
      return trimmed.startsWith('#') ? trimmed + '\n' : trimmed;
    })
    .filter((line) => !line.startsWith('//'))
    .join('');
}

module.exports = {
  filters: {
    glslminify,
  },
};
