const browserSync = require('browser-sync');

browserSync({
  server: 'public',
  files: ['public/*.html', 'public/*.js'],
});
