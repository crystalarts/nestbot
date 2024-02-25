const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("download")
    .setDescription("Check available versions for download!"),

  async execute(client, interaction) {
    await interaction.deferReply();

    const packageData = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    const packageVersion = packageData.version;

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

    const embed = new MessageEmbed()
        .setAuthor({
          name: `Download the latest version`,
          iconURL: client.user.displayAvatarURL({ dynamic: true, size: 1024 }),
        })
        .addFields({
            name: "Latest version dev-1.0.0",
            value: `\` Unable to download the application \``
        })
        .setColor("#51c0c1");

    commitInfo.forEach(info => {
        embed.addFields({
            name: "NestBot v" + packageVersion,
            value: `[\`${info.sha}\`](${info.url}) - ${info.message}`
        });
        embed.addFields({
            name: "Other download",
            value: `\`Soon\``
        });
    });

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
