const Discord = require("discord.js");
require("dotenv").config()
const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
const { readdirSync } = require('fs')
client.slash = new Discord.Collection();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const path = require('path')
const { keepalive } = require('./keepalive')
const commands = []
readdirSync("./commands/").map(async dir => {
    readdirSync(`./commands/${dir}/`).map(async (cmd) => {
        commands.push(require(path.join(__dirname, `./commands/${dir}/${cmd}`)))
    })
})
const rest = new REST({ version: "9" }).setToken(process.env.token);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.botID),
            { body: commands },
        );
        console.log('\x1b[34m%s\x1b[0m', `Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

["slash", "anticrash"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});
client.on('ready', () => {
    console.log('\x1b[34m%s\x1b[0m', `Logged in as ${client.user.tag}!`);
    client.user.setActivity('Hentaiz', { type: 'WATCHING' });
});
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand() || interaction.isContextMenu()) {
        if (!client.slash.has(interaction.commandName)) return;
        if (!interaction.guild) return;
        const command = client.slash.get(interaction.commandName)
        try {
            if (command.permissions) {
                if (!interaction.member.permissions.has(command.permissions)) {
                    return interaction.reply({ content: `:x: You need \`${command.permissions}\` to use this command`, ephemeral: true })
                }
            }
            command.run(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: ':x: There was an error while executing this command!', ephemeral: true });
        }
    }
});
// Discord-Player
const { Player } = require("discord-player");
client.player = new Player(client, {
    leaveOnEnd: false,
    leaveOnStop: false,
    leaveOnEmpty: true,
    leaveOnEmptyCooldown: 60000,
    autoSelfDeaf: true,
    initialVolume: 130,
    ytdlDownloadOptions: {
        requestOptions: {
            headers: {
                cookie: process.env.ytcookie,
            }
        }
    }
});
client.player
    .on("trackStart", (queue, track) => {
        const embed = new MessageEmbed()
            .setDescription(`🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`)
        queue.metadata.send({ embeds: [embed] });
    })

    .on("trackAdd", (queue, track) => {
        const embed = new MessageEmbed()
            .setDescription(`🎶 | Track **${track.title}** queued!`);
        queue.metadata.send({ embeds: [embed] });
    })

    .on("botDisconnect", (queue) => {
        const embed = new MessageEmbed()
            .setDescription("❌ | I was manually disconnected from the voice channel, clearing queue!");
        queue.metadata.send({ embeds: [embed] });
    })

    .on("channelEmpty", (queue) => {
        const embed = new MessageEmbed()
            .setDescription("❌ | Nobody is in the voice channel, leaving...");
        queue.metadata.send({ embeds: [embed] });
    })

    .on("queueEnd", (queue) => {
        const embed = new MessageEmbed()
            .setDescription("✅ | Queue finished!");
        queue.metadata.send({ embeds: [embed] });
    })
keepalive();
client.login(process.env.token);