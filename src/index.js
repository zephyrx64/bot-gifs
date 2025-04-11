const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// Configuração do bot
client.config = {
    colors: {
        embed: process.env.EMBED_COLOR || '#9932CC',
        success: process.env.SUCCESS_COLOR || '#00FF00',
        error: process.env.ERROR_COLOR || '#FF0000',
        warning: process.env.WARNING_COLOR || '#FFFF00',
        info: process.env.INFO_COLOR || '#00FFFF'
    },
    embedDefaults: {
        footer: {
            text: 'Random GIFs Bot © 2024'
        }
    }
};

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

// Logging de conexão
client.once('ready', () => {
    console.log(`Bot está online! Logado como ${client.user.tag}`);
    console.log(`ID do Bot: ${client.user.id}`);
    console.log(`Link de convite: https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=8`);
});

// Tentativa de login
console.log('Tentando fazer login...');
client.login(process.env.TOKEN).then(() => {
    console.log('Login bem sucedido!');
}).catch(error => {
    console.error('Erro ao fazer login:', error);
}); 