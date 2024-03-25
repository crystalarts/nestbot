const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check ping"),

  async execute(client, interaction) {
    const lat = Date.now() - interaction.createdTimestamp;
    const api = Math.round(client.ws.ping);

    const mongoPing = await new Promise((resolve, reject) => {
      const startMongo = Date.now();
      mongoose.connection.db.admin().ping((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(Date.now() - startMongo);
        }
      });
    });

    const embed = new MessageEmbed()
        .setDescription("` ⏰ Latency ` : **" + lat +"ms**\n` ⏳ Api ` : **" + api + "ms**\n` ☁️ Database ` : **" + mongoPing + "ms**")
        .setColor("#f77474");
    await interaction.reply({
      embeds: [embed]
    });
  }
}