const { Events, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'config.json');

async function loadConfig() {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { servers: {} };
    }
}

async function saveConfig(config) {
    await fs.writeFile(configPath, JSON.stringify(config, null, 4), 'utf8');
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // Carregar configuração atual
            const config = await loadConfig();
            if (!config.servers[interaction.guildId]) {
                config.servers[interaction.guildId] = {};
            }

            if (interaction.isChatInputCommand() && interaction.commandName === 'config') {
                // Verificar permissões de administrador
                if (!interaction.member.permissions.has('Administrator')) {
                    return interaction.reply({
                        content: '❌ Você precisa ter permissão de Administrador para usar este comando.',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor('#9932CC')
                    .setTitle('🛠️ Configuração do Bot')
                    .setDescription('Escolha o que deseja configurar:')
                    .addFields(
                        { name: '📷 Canal de Fotos', value: 'Selecione o canal para enviar fotos de perfil' },
                        { name: '🎞️ Canal de GIFs', value: 'Selecione o canal para enviar GIFs de perfil' },
                        { name: '🖼️ Canal de Banners', value: 'Selecione o canal para enviar banners' },
                        { name: '⏱️ Intervalo', value: 'Configure o intervalo de envio das imagens' }
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('config_select')
                            .setPlaceholder('Selecione uma opção')
                            .addOptions([
                                {
                                    label: 'Canal de Fotos',
                                    description: 'Configure o canal para fotos de perfil',
                                    value: 'photo',
                                    emoji: '📷'
                                },
                                {
                                    label: 'Canal de GIFs',
                                    description: 'Configure o canal para GIFs de perfil',
                                    value: 'gif',
                                    emoji: '🎞️'
                                },
                                {
                                    label: 'Canal de Banners',
                                    description: 'Configure o canal para banners',
                                    value: 'banner',
                                    emoji: '🖼️'
                                },
                                {
                                    label: 'Intervalo',
                                    description: 'Configure o intervalo de envio',
                                    value: 'interval',
                                    emoji: '⏱️'
                                }
                            ])
                    );

                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
            }

            if (interaction.isStringSelectMenu() && interaction.customId === 'config_select') {
                const selected = interaction.values[0];

                if (selected === 'interval') {
                    const modal = new ModalBuilder()
                        .setCustomId('interval_modal')
                        .setTitle('⏱️ Configurar Intervalo');

                    const intervalInput = new TextInputBuilder()
                        .setCustomId('interval_input')
                        .setLabel('Intervalo em segundos (mínimo 15)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Digite o intervalo em segundos...')
                        .setMinLength(1)
                        .setMaxLength(4)
                        .setRequired(true)
                        .setValue(config.servers[interaction.guildId].interval?.toString() || '15');

                    const firstActionRow = new ActionRowBuilder().addComponents(intervalInput);
                    modal.addComponents(firstActionRow);

                    return await interaction.showModal(modal);
                } else {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ChannelSelectMenuBuilder()
                                .setCustomId(`channel_${selected}`)
                                .setPlaceholder('Selecione um canal')
                                .setChannelTypes([ChannelType.GuildText])
                        );

                    await interaction.reply({
                        content: 'Selecione o canal desejado:',
                        components: [row],
                        ephemeral: true
                    });
                }
            }

            if (interaction.isChannelSelectMenu()) {
                const channelId = interaction.values[0];
                const configType = interaction.customId.split('_')[1];

                const configMap = {
                    photo: 'iconChannel',
                    gif: 'gifChannel',
                    banner: 'bannerChannel'
                };

                const configKey = configMap[configType];
                if (configKey) {
                    config.servers[interaction.guildId][configKey] = channelId;
                    await saveConfig(config);

                    const channel = interaction.guild.channels.cache.get(channelId);
                    await interaction.reply({
                        content: `✅ Canal ${channel.name} configurado com sucesso para ${configType}!`,
                        ephemeral: true
                    });
                }
            }

            if (interaction.isModalSubmit() && interaction.customId === 'interval_modal') {
                const intervalValue = parseInt(interaction.fields.getTextInputValue('interval_input'));

                if (isNaN(intervalValue) || intervalValue < 15) {
                    return interaction.reply({
                        content: '❌ O intervalo deve ser um número válido e maior ou igual a 15 segundos.',
                        ephemeral: true
                    });
                }

                config.servers[interaction.guildId].interval = intervalValue;
                await saveConfig(config);

                await interaction.reply({
                    content: `✅ Intervalo configurado para ${intervalValue} segundos com sucesso!`,
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Erro na interação:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Ocorreu um erro ao processar sua solicitação.',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
}; 
