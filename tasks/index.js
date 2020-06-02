const fs = require("fs");
const files = fs.readdirSync("./tasks/handlers");

module.exports = files.reduce((p,c) => {
  const current = require(`./handlers/${c}`);
  return {
    ...p,
    [current.name]: {
      ...current
    }
  }
}, {});
