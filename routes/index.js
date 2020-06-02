const fs = require("fs");
const files = fs.readdirSync("./routes/handlers");

module.exports = files.reduce((p,c) => {
  const current = require(`./handlers/${c}`);
  return {
    ...p,
    [current.name]: {
      ...current
    }
  }
}, {});
