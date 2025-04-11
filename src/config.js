require('dotenv').config();

module.exports = {
    colors: {
        embed: process.env.EMBED_COLOR,
        success: process.env.SUCCESS_COLOR,
        error: process.env.ERROR_COLOR,
        warning: process.env.WARNING_COLOR,
        info: process.env.INFO_COLOR
    },

    settings: {
        token: process.env.TOKEN,
        ownerId: process.env.OWNER_ID,
        defaultInterval: parseInt(process.env.DEFAULT_INTERVAL)
    },
    
    embedDefaults: {
        author: {
            name: 'Random GIFs Bot',
            iconURL: 'https://cdn.discordapp.com/attachments/123456789/987654321/bot_icon.png'
        },
        footer: {
            text: 'Random GIFs Bot © 2024'
        }
    }
}; 
