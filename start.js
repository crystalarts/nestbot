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

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  try {
    const [username, repo] = message.content.split('/');

    const apiUrl = `https://api.github.com/repos/${username}/${repo}`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || Object.keys(data).length === 0) {
        throw new Error('Repository not found.');
    }

    const thumbnailUrl = data.owner.avatar_url;

    const embed = new MessageEmbed()
        .setAuthor({ name: username, iconURL: thumbnailUrl, url: 'https://github.com/' + username})
        .setTitle(username + "/" + repo)
        .setURL(data.html_url)
        .setDescription(data.description || 'No description provided.')
        .setFooter({ text: `⭐ ${data.stargazers_count} • 👀 ${data.watchers_count} • 🍴 ${data.forks} • 🎈 ${data.open_issues}` });

    message.reply({ embeds: [embed] });
  } catch (error) {
    return;
  }
});

module.exports = client;