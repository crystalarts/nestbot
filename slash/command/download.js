const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
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
        releasesText += `[\`${release.name}\`](${release.html_url}) - ${release.tag_name}\n`;
    });

    const embed = new MessageEmbed()
        .setAuthor({
            name: `Download the latest version`,
            iconURL: client.user.displayAvatarURL({ dynamic: true, size: 1024 }),
        })
        .addFields({
            name: "Latest version dev-1.0.0",
            value: `\` Unable to download the application \``
        })
        .addFields({
            name: "NestBot (downloadable versions)",
            value: releasesText
        })
        .addFields({
            name: "NestBot (5 latest commits)",
            value: text
        })
        .addFields({
            name: "Other download",
            value: `\` Soon \``
        })
        .setColor("#51c0c1");

    lastCommandUsage[interaction.user.id] = currentTime;
    await interaction.followUp({ embeds: [embed] });
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