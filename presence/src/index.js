require('dotenv').config();
const { Client, TextChannel, Intents, Permissions } = require('discord.js');
const { START, END, ROLE } = process.env;
const sleep = require('./sleep');
let lastAccepting = false;
let ids = new Set(['']); ids.clear();
let dids = new Set(['']); dids.clear();


/**
 * Exit the process with code 1
 * @param {string?} reason Reason if any.
 */
 function bail(reason) {
    if (reason)
        console.error(reason);
    return process.exit(1);
}

/**
 * parse
 * @param {string} str
 */
function parseTime(str) {
    let [hour, minute, seconds] = str.split(':');
    if (
        (+hour == NaN || +hour < 0 || +hour > 23)
        || (+minute == NaN || +minute < 0 || +minute > 59)
        || (+seconds == NaN || +seconds < 0 || +seconds > 59)
    ) {
        return bail(`Thời gian sai định dạng. Vui lòng kiểm tra lại. Định dạng là HH:MM:SS.`)
    }

    return {
        hour: +hour, minute: +minute, seconds: +seconds
    }
}

const channelId = process.env.CHANNEL;
if (!channelId) {
    return bail(`Channel ID chưa được chỉ định. Vui lòng gán channel ID cho biến môi trường CHANNEL.`);
}
const roleId = ROLE;
if (!channelId) {
    return bail(`Role ID chưa được chỉ định. Vui lòng gán role ID cho biến môi trường ROLE.`);
}

if (!process.env.PREFIX) {
    return bail(`Prefix cho bot chưa được chỉ định. Vui lòng gán prefix cho biến môi trường PREFIX.`);
}

const timeStart = parseTime(START), timeEnd = parseTime(END);
const startString = `${
    `${timeStart.hour}`.padStart(2, '0')
}:${
    `${timeStart.minute}`.padStart(2, '0')
}:${
    `${timeStart.seconds}`.padStart(2, '0')
}`, endString = `${
    `${timeEnd.hour}`.padStart(2, '0')
}:${
    `${timeEnd.minute}`.padStart(2, '0')
}:${
    `${timeEnd.seconds}`.padStart(2, '0')
}`;
console.log(`Thời gian bắt đầu điểm danh : ${startString}`);
console.log(`Thời gian kết thúc điểm danh : ${endString}`);



const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
})
    .on('ready', entryPoint)
    .on('messageCreate', m => {
        if (m.channelId.trim() != channelId.trim()) return;
        if (!m.content.startsWith(process.env.PREFIX)) return;
        const prefix = process.env.PREFIX;
        if (m.content.slice(prefix.length).startsWith('diemdanh')) {
            if (!isAccepting()) {
                m.reply(`Đang không trong thời gian điểm danh. Thời gian điểm danh quy định là ${startString} - ${endString}`);
            }

            dids.add(m.author.id);
            m.react('✅').catch(() => {
                console.log(`Có lỗi xảy ra khi thêm reaction vào tin nhắn ID ${m.id}`);
            })
        }
    })

client.login(process.env.DISCORD_TOKEN)
    .catch(() => {
        bail('Có lỗi xảy ra khi cố gắng đăng nhập. Kiểm tra lại token cho bot, và hãy chắc chắn là bạn đã kết nối mạng.')
    })


async function check() {
    console.log(`Đang kiểm tra channel chỉ định, ID "${channelId}"`);
    /**
     * @type {TextChannel}
     */
    let channel = await client.channels.fetch(channelId)
        .catch(() => bail(`Channel với ID "${channelId}" không tồn tại. Vui lòng kiểm tra lại. Hãy chắc chắn channel này tồn tại trong server của bạn, và bot này là thành viên của server chỉ định.`))
    if (!(channel instanceof TextChannel))
        return bail(`Channel với ID "${channelId}" không phải là một text channel trong server nào. Vui lòng kiểm tra lại.`);

    // check perms
    let perms = channel.permissionsFor(client.user);
    if (!perms.has(Permissions.FLAGS.SEND_MESSAGES))
        return bail(`Bot không có quyền gửi tin nhắn trong channel với ID đã chỉ định. Vui lòng kiểm tra lại.`)

    if (!perms.has(Permissions.FLAGS.ADD_REACTIONS))
        return bail(`Bot không có quyền thêm reaction trong channel với ID đã chỉ định. Vui lòng kiểm tra lại.`)

    if (!perms.has(Permissions.FLAGS.VIEW_CHANNEL))
        return bail(`Bot không có quyền xem channel với ID đã chỉ định. Vui lòng kiểm tra lại.`)

    console.log(`Đang kiểm tra role chỉ định, ID "${roleId}"`);
    await channel.guild.roles.fetch();
    if (!channel.guild.roles.cache.get(roleId))
        return bail(`Không tồn tại role với ID ${roleId}. Vui lòng kiểm tra lại role được gán ở biến môi trường ROLE.`);
    console.log(`Kiểm tra hoàn tất.`);
}

async function entryPoint() {
    console.log(`Đăng nhập thành công dưới tài khoản ${client.user.username}#${client.user.discriminator}.`)
    await check();
    return;
}

/**
 *
 * @param {boolean} show
 * @returns
 */
function isAccepting(show) {
    let date = new Date();
    let currentHour = (date.getUTCHours() + 7) % 24; // Vietnam
    let string = `${currentHour.toString().padStart(2, '0')}:${
        date.getUTCMinutes().toString().padStart(2, '0')
    }:${date.getUTCSeconds().toString().padStart(2, '0')}`;
    if (show)
        console.log(`Thời gian hiện tại : ${string}`);
    return string > startString && string < endString;
}

async function work() {
    while (true) {
        await sleep(5000);
        if (!client.user) continue;
        // check if it's the time
        let accepting = isAccepting();
        if (accepting != lastAccepting) {
            if (!lastAccepting) {
                console.log(`Bắt đầu điểm danh.`)
                isAccepting(true);
                lastAccepting = true;
                await check();
                /**
                 * @type {TextChannel}
                 */
                let channel = await client.channels.fetch(channelId)
                let guild = await client.guilds.fetch(channel.guildId);
                console.log(`Bắt đầu tải danh sách thành viên của server ID ${channel.guildId}.`);
                let members = await guild.members.fetch();
                let validMembers = members.filter(m => m.roles.cache.has(roleId));
                ids.clear();
                for (let [memberId] of validMembers) {
                    ids.add(memberId);
                }
                console.log(`Bắt đầu điểm danh với ${ids.size} người.`);
                await channel.send([
                    `Đã đến giờ điểm danh.`,
                    `Yêu cầu các bạn có role <@&${roleId}> (${ids.size} người) dùng lệnh ${process.env.PREFIX}diemdanh trong channel <#${channelId}>.`,
                    `Thời gian điểm danh là từ ${startString} đến ${endString}.`
                ].join('\n'));
            } else {
                console.log(`Kết thúc điểm danh.`)
                lastAccepting = false;
                await check();
                /**
                 * @type {TextChannel}
                 */
                let channel = await client.channels.fetch(channelId)
                let guild = await client.guilds.fetch(channel.guildId);
                let members = await guild.members.fetch();
                let leftoverMembers = members.filter(m => ids.has(m.id) && !dids.has(m.id));


                await channel.send(`Đã hết giờ điểm danh. ${dids.size} bạn đã điểm danh :\n${
                    [...dids].map(s => `- <@${s}>`).join('\n')
                }\n\n${leftoverMembers.size} bạn chưa điểm danh :\n${
                    leftoverMembers.map(s => `- <@${s.id}>`).join('\n')
                }`);

                ids.clear();
                dids.clear();
            }
        }
    }
}

work();
