const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { checkStatus } = require("../../data/status");

const domainsToCheck = [
    { name: "nestnet.pl", url: "https://nestnet.pl/" },
    { name: "status.nestnet.pl", url: "https://status.nestnet.pl/" },
    { name: "dash.nestnet.pl", url: "https://dash.nestnet.pl/" },
    { name: "dash.login.nestnet.pl", url: "https://dash.login.nestnet.pl/" },
    { name: "dash.register.nestnet.pl", url: "https://dash.register.nestnet.pl/" },
    { name: "rapidbot.pl", url: "https://rapidbot.pl/" },
    { name: "uptime.rapidbot.pl", url: "https://uptime.rapidbot.pl/" },
    { name: "rapidcraft.pl", url: "https://rapidcraft.pl/" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check the status of our services!"),

  async execute(client, interaction) {
    await interaction.deferReply();

    const results = await checkStatus(domainsToCheck);

    let workingText = '';
    let notWorkingText = '';
    let totalServices = results.length;
    let workingServices = 0;
    let notWorkingServices = 0;

    results.forEach(result => {
        switch (result.status) {
            case 'working':
                workingText += `${result.domain}, `;
                workingServices++;
                break;
            case 'notWorking':
                notWorkingText += `🔥 ${result.domain}: ${result.error}\n`;
                notWorkingServices++;
                break;
            case 'error':
                if (result.error === 'Przekroczono czas rządania.') {
                    notWorkingText += `⌛ ${result.domain}: ${result.error}\n`;
                    notWorkingServices++;
                } else {
                    notWorkingText += `❓ ${result.domain}: ${result.error}\n`;
                    notWorkingServices++;
                }
                break;
            default:
                break;
        }
    });

    const embed = new MessageEmbed()
        .setAuthor({
          name: `Status of our services`,
          iconURL: client.user.displayAvatarURL({ dynamic: true, size: 1024 }),
        })
        .setColor("#51c0c1");

    if (notWorkingText) {
        embed.addFields({ name: 'Errors:', value: notWorkingText });
    } else {
        embed.addFields({ name: 'Errors:', value: "🟢 Everything works" });
    }

    if (workingText) {
        embed.addFields({ name: 'Working services:', value: workingText });
    } else {
        embed.addFields({ name: 'Working services:', value: "🔥 Nothing works" });
    }

    const percentWorking = (workingServices / totalServices * 100).toFixed(2);
    const percentNotWorking = (notWorkingServices / totalServices * 100).toFixed(2);

    embed.setFooter({ text: `Working services: ${workingServices} (${percentWorking}%) • Errors: ${notWorkingServices} (${percentNotWorking}%)` })

    await interaction.followUp({ embeds: [embed] });
  }
}