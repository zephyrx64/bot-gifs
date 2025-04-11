const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure the bot settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Open the configuration panel')),
    
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('Você precisa ter permissão de administrador para usar este comando.');
                
                return interaction.reply({ 
                    embeds: [errorEmbed],
                    ephemeral: true 
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('Painel de Configuração')
                .setDescription('Selecione uma opção para configurar:')
                .setColor(interaction.client.config?.colors?.embed || '#9932CC')
                .setFooter({ text: 'Random GIFs Bot © 2024' });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('config-select')
                .setPlaceholder('Selecione uma opção')
                .addOptions([
                    {
                        label: 'Canal de Fotos',
                        description: 'Definir o canal para fotos de perfil',
                        value: 'icon'
                    },
                    {
                        label: 'Canal de GIFs',
                        description: 'Definir o canal para avatares animados',
                        value: 'gif'
                    },
                    {
                        label: 'Canal de Banners',
                        description: 'Definir o canal para banners',
                        value: 'banner'
                    },
                    {
                        label: 'Intervalo',
                        description: 'Definir o intervalo entre as postagens (em segundos)',
                        value: 'interval'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ 
                embeds: [embed], 
                components: [row], 
                ephemeral: true 
            });
        } catch (error) {
            console.error('Erro no comando config:', error);
            await interaction.reply({ 
                content: 'Houve um erro ao executar este comando!', 
                ephemeral: true 
            });
        }
    }
}; 