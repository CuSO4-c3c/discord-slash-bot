const { QueryType } = require('discord-player');
const { GuildMember } = require('discord.js');

module.exports = {
    name: "play",
    description: "Playing music",
    options: [
        {
            name: 'query',
            type: 3,
            description: 'The song you want to play',
            required: true,
        },
    ],
    run: async (interaction, client) => {
        try {
            if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
                return void interaction.reply({ content: "You are not in a voice channel!", ephemeral: true });
            }
            if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) {
                return void interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
            }
            await interaction.deferReply();
            const query = interaction.options.get('query').value;
            const searchResult = await client.player
                .search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO,
                })
                .catch(() => { });
            if (!searchResult || !searchResult.tracks.length)
                return void interaction.followUp({ content: 'No results were found!' });

            const queue = await client.player.createQueue(interaction.guild, {
                metadata: interaction.channel,
            });
            try {
                if (!queue.connection) await queue.connect(interaction.member.voice.channel);
            } catch {
                void client.player.deleteQueue(interaction.guildId);
                return void interaction.followUp({ content: 'Could not join your voice channel!' });
            }
            await interaction.followUp({ content: `⏱ | Loading your ${searchResult.playlist ? 'playlist' : 'track'}...`, });
            searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
            if (!queue.playing) await queue.play();
        } catch (e) {
            interaction.followUp({content: 'Error! An error occurred. Please try again later: ' + e.message})       
        }
    }
}