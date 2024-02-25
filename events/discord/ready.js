const commands = [];
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");
const fs = require("fs");
require('dotenv').config();

module.exports = {
  name: "ready",

  execute: async (client) => {
    console.log("Zalogowano bota");

    const packageData = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    const packageVersion = packageData.version;

    client.user.setPresence({
      activities: [
        {
          name: "NestNet.pl v" + packageVersion,
        },
      ],
    });

    fs.readdirSync(process.cwd() + "/slash").forEach((dirs) => {
      const files = fs
        .readdirSync(process.cwd() + `/slash/${dirs}`)
        .filter((files) => files.endsWith(".js"));
      for (const file of files) {
        const slash = require(process.cwd() + `/slash/${dirs}/${file}`);
        commands.push(slash.data.toJSON());
      }
    });

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    (async () => {
      try {
        await rest
          .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
          .catch((err) => console.log(err));

        console.log(
          "Pomyślnie ponownie załadowano polecenia aplikacji."
        );
      } catch (error) {
        console.error(error);
      }
    })();
  },
};
