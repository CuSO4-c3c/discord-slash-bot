const Discord = require("discord.js");
require("dotenv").config()
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
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
        console.log('\x1b[34m%s\x1b[0m',`Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

["slash", "anticrash"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});
client.on('ready', () => {
    console.log('\x1b[34m%s\x1b[0m',`Logged in as ${client.user.tag}!`);
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
keepalive();
client.login(process.env.token);