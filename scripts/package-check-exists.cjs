const fs = require('fs');
const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));

function checkExists(prop) {
  if (prop instanceof Array) {
    for (const path of prop) {
      if (!fs.existsSync(type)) {
        console.error('file not found: ', type);
        process.exit(2);
      }
    }
  } else {
    if (typeof prop === 'string') {
      if (!fs.existsSync(prop)) {
        console.error('file not found: ', prop);
        process.exit(2);
      }
    }
  }
}

checkExists(package.types);
checkExists(package.module);
checkExists(package.main);
checkExists(package.exports['.'].require);
checkExists(package.exports['.'].import);
