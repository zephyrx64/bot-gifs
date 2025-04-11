const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Caminho para o arquivo de configuração
const configPath = path.join(__dirname, '..', 'data', 'config.json');

// Função para carregar configurações
async function loadConfig() {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { servers: {} };
    }
}

// Função para salvar configurações
async function saveConfig(config) {
    await fs.writeFile(configPath, JSON.stringify(config, null, 4), 'utf8');
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Bot está online! Logado como ${client.user.tag}`);
        console.log(`ID do Bot: ${client.user.id}`);
        console.log(`Link de convite: https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=8`);

        // Função para enviar imagens
        async function enviarImagens() {
            try {
                const config = await loadConfig();
                
                // Para cada servidor configurado
                for (const [guildId, serverConfig] of Object.entries(config.servers)) {
                    const guild = client.guilds.cache.get(guildId);
                    if (!guild) continue;

                    // Forçar atualização da lista de membros
                    await guild.members.fetch();

                    const iconChannel = guild.channels.cache.get(serverConfig.iconChannel);
                    const gifChannel = guild.channels.cache.get(serverConfig.gifChannel);
                    const bannerChannel = guild.channels.cache.get(serverConfig.bannerChannel);

                    if (!iconChannel && !gifChannel && !bannerChannel) continue;

                    // Pegar TODOS os membros (exceto bots)
                    const members = Array.from(guild.members.cache.values())
                        .filter(member => !member.user.bot);

                    if (members.length === 0) continue;

                    // Escolher um membro aleatório
                    const randomMember = members[Math.floor(Math.random() * members.length)];

                    try {
                        // Buscar informações do usuário na API do Discord
                        const userData = await axios.get(`https://discord.com/api/users/${randomMember.id}`, {
                            headers: {
                                Authorization: `Bot ${client.token}`
                            }
                        });

                        // Enviar banner se existir
                        if (bannerChannel && userData.data.banner) {
                            const bannerUrl = userData.data.banner.startsWith('a_')
                                ? `https://cdn.discordapp.com/banners/${randomMember.id}/${userData.data.banner}.gif?size=2048`
                                : `https://cdn.discordapp.com/banners/${randomMember.id}/${userData.data.banner}.png?size=2048`;

                            const bannerEmbed = new EmbedBuilder()
                                .setAuthor({
                                    name: randomMember.user.tag,
                                    iconURL: randomMember.user.displayAvatarURL({ dynamic: true })
                                })
                                .setColor('#9932CC')
                                .setImage(bannerUrl)
                                .setTimestamp()
                                .setFooter({ text: `ID: ${randomMember.id} • ${randomMember.presence?.status || 'offline'}` });

                            const bannerRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel('Baixar Banner')
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(bannerUrl)
                                );

                            await bannerChannel.send({
                                embeds: [bannerEmbed],
                                components: [bannerRow]
                            });
                        }

                        // Enviar avatar
                        const avatarUrl = randomMember.user.displayAvatarURL({ 
                            dynamic: true, 
                            size: 2048 
                        });

                        const avatarEmbed = new EmbedBuilder()
                            .setAuthor({
                                name: randomMember.user.tag,
                                iconURL: randomMember.user.displayAvatarURL({ dynamic: true })
                            })
                            .setColor('#9932CC')
                            .setImage(avatarUrl)
                            .setTimestamp()
                            .setFooter({ text: `ID: ${randomMember.id} • ${randomMember.presence?.status || 'offline'}` });

                        const avatarRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setLabel('Baixar Avatar')
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(avatarUrl)
                            );

                        // Enviar para o canal apropriado baseado no tipo de avatar
                        if (avatarUrl.includes('.gif') && gifChannel) {
                            await gifChannel.send({
                                embeds: [avatarEmbed],
                                components: [avatarRow]
                            });
                        } else if (!avatarUrl.includes('.gif') && iconChannel) {
                            await iconChannel.send({
                                embeds: [avatarEmbed],
                                components: [avatarRow]
                            });
                        }

                    } catch (error) {
                        console.error(`Erro ao buscar dados do usuário ${randomMember.id}:`, error);
                    }
                }
            } catch (error) {
                console.error('Erro ao enviar imagens:', error);
            }
        }

        // Iniciar o loop de envio de imagens
        setInterval(async () => {
            const config = await loadConfig();
            for (const [guildId, serverConfig] of Object.entries(config.servers)) {
                const interval = serverConfig.interval || 15;
                if (Date.now() - (serverConfig.lastSent || 0) >= interval * 1000) {
                    await enviarImagens();
                    config.servers[guildId].lastSent = Date.now();
                    await saveConfig(config);
                }
            }
        }, 5000); // Verifica a cada 5 segundos
    }
}; 