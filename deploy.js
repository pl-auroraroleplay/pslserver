import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';


const commands = [
new SlashCommandBuilder()
.setName('lvl')
.setDescription('Pokaż level użytkownika')
.addUserOption(opt => opt
.setName('user')
.setDescription('Użytkownik (opcjonalnie)')
.setRequired(false)
)
.toJSON(),
new SlashCommandBuilder()
.setName('top')
.setDescription('Pokaż TOP 10 osób z największym levelem na serwerze')
.toJSON()
];


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);


async function main() {
try {
if (process.env.DISCORD_GUILD_ID) {
await rest.put(
Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
{ body: commands }
);
console.log('✅ Zarejestrowano komendy GUILD');
} else {
await rest.put(
Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
{ body: commands }
);
console.log('✅ Zarejestrowano komendy GLOBAL');
}
} catch (err) {
console.error('❌ Błąd rejestracji komend:', err);
}
}


main();