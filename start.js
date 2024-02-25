const { Client, Collection, MessageEmbed } = require("discord.js");
const client = new Client({ intents: 32767 });
const fs = require("fs");
const axios = require('axios');
require('dotenv').config();

client.login(process.env.TOKEN);

process.on("uncaughtException", console.log);

client.collection_slash = new Collection();

fs.readdirSync("./slash").forEach((dirs) => {
  const files = fs
    .readdirSync(`./slash/${dirs}`)
    .filter((files) => files.endsWith(".js"));
  for (const file of files) {
    const slash = require(`./slash/${dirs}/${file}`);
    client.collection_slash.set(slash.data.name, slash);
  }
});

fs.readdirSync("./events").forEach((dirs) => {
  const files = fs
    .readdirSync(`./events/${dirs}`)
    .filter((files) => files.endsWith(".js"));
  for (const file of files) {
    const event = require(`./events/${dirs}/${file}`);
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
});

module.exports = client;