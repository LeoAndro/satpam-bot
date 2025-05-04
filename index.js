// Bot Discord untuk mendeteksi dan menghapus umpatan dalam Bahasa Indonesia
// Menggunakan discord.js

const { Client, GatewayIntentBits, Events } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// PENTING: Pastikan intent MESSAGE_CONTENT sudah diaktifkan di Developer Portal Discord

// Daftar kata-kata umpatan dalam Bahasa Indonesia
// Anda bisa menambah atau mengurangi kata-kata dalam daftar ini sesuai kebutuhan
const kataUmpatan = [
  'anjing', 'bangsat', 'babi', 'kampret', 'tolol', 'goblok', 'goblog', 
  'bego', 'bodoh', 'idiot', 'bajingan', 'keparat', 'tai', 'tahi', 'sialan',
  'memek', 'kontol', 'ngentot', 'ngewe', 'asu', 'cok', 'cuk', 'jancok', 
  'jancuk', 'pantek', 'dancok', 'bejad', 'perek', 'jablay', 'lonte', 
  'sundal', 'gila', 'sinting', 'sarap', 'geblek', 'bedebah'
];

// Menggunakan regex untuk mendeteksi kata-kata umpatan - versi sederhana
const buatRegexUmpatan = () => {
  // Versi sederhana dulu untuk debugging
  const pattern = kataUmpatan.map(kata => {
    return `\\b${kata}\\b`;
  });

  return new RegExp(pattern.join('|'), 'i');
};

const regexUmpatan = buatRegexUmpatan();

// Fungsi untuk memeriksa teks umpatan tanpa regex (backup method)
function cekKataKasar(text) {
  const textLower = text.toLowerCase();
  for (const kata of kataUmpatan) {
    if (textLower.includes(kata)) {
      console.log(`Kata kasar terdeteksi: ${kata}`);
      return true;
    }
  }
  return false;
}

// Event saat bot siap
client.once(Events.ClientReady, () => {
  console.log(`Bot siap! Masuk sebagai ${client.user.tag}`);
});

// Event saat ada pesan baru
client.on(Events.MessageCreate, async (message) => {
  // Mengabaikan pesan dari bot itu sendiri
  if (message.author.bot) return;

  // Debug: Log pesan yang diterima untuk memastikan bot membaca pesan
  console.log(`Pesan diterima dari ${message.author.tag}: ${message.content}`);

  // Periksa apakah pesan mengandung umpatan dengan dua metode
  const containsBadWord = regexUmpatan.test(message.content) || cekKataKasar(message.content);
  console.log(`Pesan mengandung kata kasar: ${containsBadWord}`);

  if (containsBadWord) {
    try {
      // Cek apakah bot memiliki izin menghapus pesan
      if (!message.guild || !message.member) {
        console.log('Pesan bukan dari guild atau member tidak ditemukan');
        return;
      }

      const botMember = message.guild.members.cache.get(client.user.id);
      if (!botMember) {
        console.log('Bot member tidak ditemukan di guild');
        return;
      }

      // Cek permission bot di channel
      const permissions = message.channel.permissionsFor(botMember);
      if (!permissions || !permissions.has('ManageMessages')) {
        console.log('Bot tidak memiliki izin ManageMessages di channel ini');
        // Kirim pesan ke channel bahwa bot tidak memiliki izin
        await message.channel.send('Bot membutuhkan izin "Manage Messages" untuk menghapus pesan.');
        return;
      }

      // Hapus pesan yang mengandung umpatan
      await message.delete();
      console.log('Pesan berhasil dihapus');

      // Kirim peringatan ke pengguna
      const warning = await message.channel.send(
        `${message.author}, mohon jaga kesopanan. Pesan yang mengandung kata-kata tidak pantas akan dihapus.`
      );

      // Hapus pesan peringatan setelah 5 detik
      setTimeout(() => {
        warning.delete().catch(console.error);
      }, 5000);

      console.log(`Pesan berisi umpatan dari ${message.author.tag} telah dihapus`);
    } catch (error) {
      console.error('Gagal menghapus pesan:', error);
      // Coba kirim pesan error untuk debugging
      try {
        await message.channel.send(`Error: ${error.message}`);
      } catch (e) {
        console.error('Gagal mengirim pesan error:', e);
      }
    }
  }
});

// Setup perintah debug (definisikan di bawah)
function setupDebugCommands() {
  client.on('messageCreate', async (message) => {
    // Hanya merespon perintah dari pengguna (bukan bot)
    if (message.author.bot) return;

    // Perintah debug untuk mengecek apakah bot bekerja
    if (message.content === '!ping') {
      await message.reply('Pong! Bot aktif dan berjalan.');
    }

    // Perintah untuk mengecek izin bot
    if (message.content === '!cekizin') {
      try {
        const botMember = message.guild.members.cache.get(client.user.id);
        if (!botMember) {
          await message.reply('Tidak dapat menemukan informasi bot di server ini.');
          return;
        }

        const permissions = message.channel.permissionsFor(botMember);
        const hasManageMessages = permissions.has('ManageMessages');

        await message.reply(`Bot memiliki izin Manage Messages: ${hasManageMessages ? '✅ Ya' : '❌ Tidak'}`);
      } catch (error) {
        await message.reply(`Error saat mengecek izin: ${error.message}`);
      }
    }

    // Perintah untuk mengecek apakah deteksi kata kasar bekerja
    if (message.content.startsWith('!cekkata ')) {
      const testWord = message.content.slice(9); // Menghapus "!cekkata " dari pesan
      const isBAD = regexUmpatan.test(testWord);
      const isBAD2 = cekKataKasar(testWord);

      await message.reply(`"${testWord}" terdeteksi sebagai kata kasar:\nMetode regex: ${isBAD ? '✅ Ya' : '❌ Tidak'}\nMetode includes: ${isBAD2 ? '✅ Ya' : '❌ Tidak'}`);
    }

    // Perintah untuk melihat daftar kata yang diblokir
    if (message.content === '!daftarkata') {
      // Hanya kirim 10 kata pertama untuk keamanan
      const shortList = kataUmpatan.slice(0, 10);
      await message.reply(`Daftar 10 kata pertama yang diblokir: ${shortList.join(', ')}...`);
    }
  });

  console.log('Debug commands have been set up successfully!');
}

// Aktifkan perintah debug
setupDebugCommands();

// Login ke Discord dengan token dari Replit secrets
client.login(process.env.DISCORD_TOKEN);
