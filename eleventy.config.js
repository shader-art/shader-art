const plugins = require('./plugins');
const navigationData = require('./navigation-data');

module.exports = (eleventyConfig) => {
  // custom watch targets
  eleventyConfig.addWatchTarget('./src/assets');
  eleventyConfig.addWatchTarget('./src/game');

  eleventyConfig.addPlugin(plugins);

  // Collections
  eleventyConfig.addCollection('slides', function (collectionApi) {
    const all = collectionApi.getAll();
    return navigationData
      .map((fileSlug) => all.find((item) => item.fileSlug === fileSlug))
      .filter(Boolean);
  });


  // short codes
  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`); // current year, stephanie eckles

  // passthrough copy
  eleventyConfig.addPassthroughCopy('src/images');

  // social icons to root directory
  eleventyConfig.addPassthroughCopy({
    'src/assets/images/favicon/*': '/',
  });

  eleventyConfig.addPassthroughCopy({
    'src/assets/css/global.css': 'src/_includes/global.css',
  });

  // Tell 11ty to use the .eleventyignore and ignore our .gitignore file
  eleventyConfig.setUseGitIgnore(false);

  return {
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      output: 'dist',
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
    },
  };
};
