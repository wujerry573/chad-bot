const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const { config } = require("./config");

//creating new client
const client = new Discord.Client();
client.login(config.token);

const queue = new Map();

//listeners for client
client.once("ready", () => {
  console.log("connected to discord");
});
client.once("reconnecting", () => {
  console.log("reconnecting to discord");
});
client.once("disconnect", () => {
  console.log("disconnected from discord");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${config.prefix}play`)) {
    search(message, serverQueue);
    return;
  }
  if (message.content.startsWith(`${config.prefix}stop`)) {
    stop(message, serverQueue);
    return;
  }
  if (message.content.startsWith(`${config.prefix}skip`)) {
    skip(message, serverQueue);
    return;
  }
});

async function search(message, serverQueue) {
  const arguments = message.content.split(" ");
  const voiceChannel = message.member.voiceChannel;
  if (!voiceChannel)
    return message.channel.sender(
      "idiot, be in a voice channel to play music virgin"
    );

  const songInfo = await ytdl.getInfo(arguments[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const newQueue = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, newQueue);
    console.log(song);
    newQueue.songs.push(song);

    try {
      let connection = await voiceChannel.join();
      newQueue.connection = connection;
      console.log(newQueue.songs);
      play(message, newQueue.songs[0]);
    } catch (error) {
      console.log(error);
      queue.delete(message.guild.id);
      return message.channel.send(error);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(
      `bro i added ${song.title} to the queue, you owe me one`
    );
  }
}

function play(message, song) {
  const serverQueue = queue.get(message.guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(message.guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .playStream(ytdl(song.url, { filter: "audioonly" }))
    .on("end", () => {
      serverQueue.songs.shift();
      play(message, serverQueue.songs[0]);
      message.channel.send(`currently listening to ${song.title} brah`);
    })
    .on("error", error => {
      console.error(error);
    });
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

function skip(message, serverQueue) {
  if (!message.member.voiceChannel)
    return message.channel.send(
      "bro use your brain, you need to be in a voice channel...."
    );
  if (!serverQueue)
    return message.channel.send(
      "are you delusional?????? there's no music queued"
    );
  serverQueue.connection.dispatcher.end();
  message.channel.send('gg go next')
}

function stop(message, serverQueue) {
  if (!message.member.voiceChannel)
    return message.channel.send(
      "bro use your brain, you need to be in a voice channel...."
    );
  if (!serverQueue)
    return message.channel.send(
      "are you delusional?????? there's no music queued"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  message.channel.send("we out homie, peace");
}

/*    if (message.member.voiceChannel) {
      message.member.voiceChannel
        .join()
        .then(connection => {
          const dispatcher = connection.playFile(
            "/Users/jerrywu/Downloads/Can I Love.mp3"
          );
          dispatcher.on("end", () => {});
        })
        .catch(console.error);
    }
    */
