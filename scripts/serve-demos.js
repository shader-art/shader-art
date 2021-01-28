/**
 * Require Browsersync
 */
var browserSync = require('browser-sync');

/**
 * Run Browsersync with server config
 */
browserSync({
  server: 'public',
  files: ['public/*.html', 'public/*.js'],
});
