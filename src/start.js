const { Client, Collection, MessageEmbed } = require("discord.js");
const client = new Client({ intents: 32767 });
const fs = require("fs");
const axios = require('axios');
require('dotenv').config();

client.login(process.env.TOKEN);

process.on("uncaughtException", console.log);

client.collection_slash = new Collection();

fs.readdirSync(process.cwd() + "/src/slash").forEach((dirs) => {
  const files = fs
    .readdirSync(process.cwd() + `/src/slash/${dirs}`)
    .filter((files) => files.endsWith(".js"));
  for (const file of files) {
    const slash = require(process.cwd() + `/src/slash/${dirs}/${file}`);
    client.collection_slash.set(slash.data.name, slash);
  }
});

fs.readdirSync(process.cwd() + "/src/events").forEach((dirs) => {
  const files = fs
    .readdirSync(process.cwd() + `/src/events/${dirs}`)
    .filter((files) => files.endsWith(".js"));
  for (const file of files) {
    const event = require(process.cwd() + `/src/events/${dirs}/${file}`);
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
});

function formatDateTime(dateTimeString) {
  const dateTime = new Date(dateTimeString);
  const time = dateTime.toLocaleTimeString([], { hour12: false });
  const date = dateTime.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${time} ${date}`;
}

const defaultOwner = "nestnetpl";
const defaultRepo = "nestbot"

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  try {
    const sendRepo = async (results) => {
      try {
        const [owner, repo] = results[0].split("/");
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || Object.keys(data).length === 0) {
          throw new Error('Repository not found.');
        }

        const thumbnailUrl = data.owner.avatar_url;

        const embed = new MessageEmbed()
          .setAuthor({ name: owner, iconURL: thumbnailUrl, url: 'https://github.com/' + owner})
          .setTitle(owner + "/" + repo)
          .setURL(data.html_url)
          .setDescription(data.description || 'No description provided.')
          .setFooter({ text: `⭐ ${data.stargazers_count} • 👀 ${data.watchers_count} • 🍴 ${data.forks} • 🎈 ${data.open_issues}` });

        return embed;
      } catch (e) {
        return;
      }
    };

    const sendIssue = async (repo, issueNumber) => {
      try {
        const apiUrl = `https://api.github.com/repos/${defaultOwner}/${repo}/issues/${issueNumber}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || Object.keys(data).length === 0) {
          return new Error('Issue not found.');
        }

        if (response.status === 404) {
          console.log("nie ma!")
          return;
        }

        const isPullRequest = "pull_request" in data;
        let color;

        if (data.state === "open") {
          color = "#adff7d";
        } else if (data.state === "closed") {
          color = "#ff957d";
        }

        const formattedCreatedAt = formatDateTime(data.created_at);
        const formattedUpdatedAt = formatDateTime(data.updated_at);

        if (isPullRequest) {
          const pullRequest = data.pull_request;

          if (pullRequest.merged_at !== null) {
            color = "#a477f7";
          } else if (data.draft) {
            color = "#6d7085";
          }
        }

        const state = data.state
        const stateInfo = {
          open: "**🔓 Open**",
          cloded: "**🔒 Closed**"
        }

        const embed = new MessageEmbed()
          .setTitle(
            (isPullRequest ? "Pull request" : "Issue") +
              `#${data.number}`,
          )
          .setURL(data.html_url)
          .setDescription(
            "` 🔍 Status ` : " + stateInfo[state] + "\n` 💥 Temat ` : **" + data.title + "**\n` 🍀 Etykietka ` : **" + data.labels[0].name + "**\n\n` 📆 Utworzone ` : **" + formattedCreatedAt + "**\n` ⏰ Zaktualizowane `: **" + formattedUpdatedAt + "**"
          )
          .setAuthor({
            name: data.user.login,
            iconURL: data.user.avatar_url,
            url: data.user.html_url,
          })
          .setFooter({
            text: `💬 ${data.comments}`,
          })
          .setColor(color);

        return embed;
      } catch (e) {
        return;
      }
    };

    const regRepo = /[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+/g;
    const resRepo = regRepo.exec(message.content);
    if (resRepo?.length) {
      return message.reply({ embeds: [await sendRepo(resRepo)] });
    }

    const regIssue = /(?<=#)([0-9]+)/g;
    const resIssue = regIssue.exec(message.content);
    if (resIssue?.length) {
      return message.reply({
        embeds: [await sendIssue(defaultRepo, resIssue)],
      });
    }

  } catch (error) {
    return;
  }
});

require("./database")
require("./website")
module.exports = client;