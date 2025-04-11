const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.TOKEN) {
    console.error('TOKEN não está definido no arquivo .env');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('CLIENT_ID não está definido no arquivo .env');
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Comandos encontrados:', commandFiles);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`Comando carregado: ${command.data.name}`);
    } else {
        console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute" requerida`);
    }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Iniciando registro dos comandos slash...');
        console.log(`Total de comandos: ${commands.length}`);
        console.log(`Client ID: ${process.env.CLIENT_ID}`);

        // Registrar comandos globalmente
        console.log('Registrando comandos globalmente...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Comandos registrados com sucesso!');
        console.log('Aguarde até 1 hora para os comandos aparecerem em todos os servidores.');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
        if (error.status === 403) {
            console.error('Erro de permissão! Por favor:');
            console.error('1. Use este link para adicionar o bot:');
            console.error(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`);
            console.error('2. Certifique-se de marcar tanto "bot" quanto "applications.commands"');
        }
    }
})(); 