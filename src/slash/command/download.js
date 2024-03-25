const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  Client,
  Intents,
  MessageEmbed,
  Collection,
  GuildMember,
  MessageActionRow,
  MessageSelectMenu,
  MessageButton,
} = require("discord.js");
const axios = require("axios");
const fs = require("fs");

const lastCommandUsage = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("download")
    .setDescription("Check available versions for download!"),

  async execute(client, interaction) {
    const cooldown = 10000; 
    const currentTime = Date.now();

    if (lastCommandUsage[interaction.user.id] && (currentTime - lastCommandUsage[interaction.user.id]) < cooldown) {
      const remainingTime = Math.ceil((lastCommandUsage[interaction.user.id] + cooldown - currentTime) / 1000);
      await interaction.reply({ content: `You can use this command again in ${remainingTime} seconds.`, ephemeral: true });
      return;
    }

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("select")
        .setPlaceholder("Please select the appropriate category")
        .addOptions([
          {
            label: "NestBot",
            description: "Click me",
            emoji: "1198229791854313512",
            value: "nestbot",
          },
        ])
    );

    const filter = (i) =>
      i.customId === "select" && i.user.id === interaction.user.id;

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    await interaction.deferReply();

    const packageData = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    const packageVersion = packageData.version;

    let text = '';
    let releasesText = '';

    const owner = "nestnetpl";
    const repo = "nestbot";
    const commits = await fetchCommits(owner, repo);

    const commitInfo = commits.map(commit => {
        return {
            url: commit.html_url,
            message: commit.commit.message,
            sha: commit.sha.slice(0, 7)
        };
    });

    commitInfo.forEach(info => {
        text += `[\`${info.sha}\`](${info.url}) - ${info.message}\n`;
    });

    const releases = await fetchReleases(owner, repo);

    releases.forEach(release => {
        releasesText += `[\`${release.name}\`](${release.zipball_url}) - ${release.tag_name}\n`;
    });

    const embed = new MessageEmbed()
      .setAuthor({
        name: `Download the latest version`,
        iconURL: client.user.displayAvatarURL({ dynamic: true, size: 1024 }),
      })
      .setDescription(
        "Select one item from the select menu to see available versions for download."
      )
      .setColor("#f77474")
      .setFooter({ text: "NestNet © 2024 ・ Version: " + packageVersion });

    await interaction.followUp({
      embeds: [embed],
      components: [row],
    });

    collector.on("collect", async (i) => {
      if (i.customId === "select") {
        if (i.values[0] === "nestbot") {
          i.update({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                    name: `Download the latest version of NestBot`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true, size: 1024 }),
                })
                .addFields({
                    name: "Downloadable versions:",
                    value: releasesText
                })
                .addFields({
                    name: "5 latest commits:",
                    value: text
                })
                .setFooter({ text: "NestNet © 2024 ・ Version: " + packageVersion })
                .setColor("#f77474")
            ],
            allowedMentions: { repliedUser: false },
            components: [row],
          });
        }
      }
    });

    lastCommandUsage[interaction.user.id] = currentTime;
  }
}

async function fetchCommits(owner, repo) {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        params: {
            per_page: 5,
        },
    });
    return response.data;
}

async function fetchReleases(owner, repo) {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`, {
        params: {
            per_page: 5,
        },
    });
    return response.data;
}