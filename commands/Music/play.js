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
        const voiceChannel = interaction.member.voice.channel
        const query = interaction.options.get('query').value
        if (!voiceChannel){
            return interaction.reply({ content: "Please join a voice channel!", ephemeral: true, });
        }
        await interaction.reply("🔍 **Searching and attempting...**");
        await interaction.editReply('Searching done :ok_hand: ');
        client.distube.playVoiceChannel(voiceChannel, query, {
            textChannel: interaction.channel,
            member: interaction.member,
        })
    }
}