import { Client, GatewayIntentBits, Events } from 'discord.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const privateKey = [
    process.env.FIREBASE_PRIVATE_KEY_LINE1,
    process.env.FIREBASE_PRIVATE_KEY_LINE2,
    process.env.FIREBASE_PRIVATE_KEY_LINE3,
    process.env.FIREBASE_PRIVATE_KEY_LINE4,
    process.env.FIREBASE_PRIVATE_KEY_LINE5,
    process.env.FIREBASE_PRIVATE_KEY_LINE6
].join('\n');

const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, () => {
    console.log(`Zalogowano jako ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'lvl') {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userDoc = db.collection('levels').doc(targetUser.id);
        const userSnap = await userDoc.get();

        if (!userSnap.exists) {
            await interaction.reply(`${targetUser.username} nie ma jeszcze żadnego poziomu.`);
            return;
        }

        const userData = userSnap.data();
        await interaction.reply(`${targetUser.username} ma aktualnie **${userData.level} level**.`);
    }

    if (interaction.commandName === 'top') {
        const levelsRef = db.collection('levels');
        const snapshot = await levelsRef.orderBy('level', 'desc').limit(10).get();

        if (snapshot.empty) {
            await interaction.reply('Brak danych o poziomach.');
            return;
        }

        let topList = '🏆 **Top 10 użytkowników**:\n';
        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            topList += `${rank}. <@${doc.id}> — **Level ${data.level}**\n`;
            rank++;
        });

        await interaction.reply(topList);
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    const userDoc = db.collection('levels').doc(message.author.id);
    const userSnap = await userDoc.get();

    let userData = { messages: 0, level: 0 };
    if (userSnap.exists) userData = userSnap.data();

    userData.messages++;

    const requiredMessages = (userData.level + 1) * 10;
    if (userData.messages >= requiredMessages) {
        userData.level++;
        userData.messages = 0;

        await message.channel.send(`🎉 Gratulacje <@${message.author.id}>! Wbiłeś **level ${userData.level}**!`);
    }

    await userDoc.set(userData);
});

client.login(process.env.DISCORD_TOKEN);
