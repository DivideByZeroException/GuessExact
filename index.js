import axios from 'axios'
import express from "express"
const app = express();
const port = 3000;
import dotenv from 'dotenv';
import('discord.js')
dotenv.config();
app.get('/', (req, res) => {
    res.send('Привет, мир!');
});

app.listen(port, () => {
    console.log(`Express-сервер запущен на порту ${port}`);
});

import { Client, GatewayIntentBits } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

const client = new Client({
  intents: Object.keys(GatewayIntentBits).map((a) => GatewayIntentBits[a]),
});

function generateRandomHexColor() {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    const hexColor = "#" + "0".repeat(6 - randomColor.length) + randomColor;
    return hexColor;
}

function sendImage() {
    const channel = client.channels.cache.get(channelId);
    const channel_secret = client.channels.cache.get(secret_channel_id);
    if (channel && channel_secret) {
        let exampleEmbed = new EmbedBuilder()
            .setColor(generateRandomHexColor())
            .setTitle("Угадай страну")

            .setImage(imgURL)
        channel.send({
            embeds: [exampleEmbed]
        });
        channel_secret.send(iso);
    } else {
        console.error(`Канал с ID ${channelId} не найден.`);
    }

}
client.on('ready', () => {
    console.log(`Бот запущен как ${client.user.tag}`);
    setImg();
});

client.on('messageCreate', (message) => {

    if (message.channelId != channelId) {} else {
        if (message.content.toLowerCase() == "/hint") {
            let flagEmoji = String.fromCodePoint(...iso.split('').map(c => c.charCodeAt(0) + 127397));
            message.react(flagEmoji);
        }
        if (message.content.toLowerCase() == "/skip") {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send("Это было " + iso + " " + String.fromCodePoint(...iso.split('').map(c => c.charCodeAt(0) + 127397)))
                iso = null;
                setImg();
            }
        }

        if (message.content.toUpperCase() == iso) {
            message.react('✅');
           
            const channel = client.channels.cache.get(channelId);
 
            if (channel) {
                channel.send("<@"+message.author.id+"> Правильно угадал. Страна была "+iso + " " + String.fromCodePoint(...iso.split('').map(c => c.charCodeAt(0) + 127397))+ '. Следующая картинка на подходе!');
            }
            iso = null;
            setImg();
        } else if (message.content.length == 2) {
            message.react('❌');
        }

    }
});


let iso = "";

const apiKey = process.env.API_KEY_MAPILLARY;

var imgURL = "";




async function getCountryCodeByCoordinates(lat, lng, username) {
    const apiUrl = `http://api.geonames.org/countryCodeJSON?lat=${lat}&lng=${lng}&username=${username}`;

    try {
        const response = await axios.get(apiUrl);

        if (response.data.countryCode) {
            const countryCode = response.data.countryCode.toUpperCase();
            return countryCode;
        } else {
            throw new Error('Unable to retrieve country code.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}


const channelId = '1198273314712473620';
const secret_channel_id = '1198277832133070931';



function setImg() {
    var randomCoordinates = generateRandomCoordinates();
    var url = `https://graph.mapillary.com/images?access_token=${apiKey}&fields=id,computed_geometry,thumb_1024_url&bbox=` + randomCoordinates.minLongitude + "," + randomCoordinates.minLatitude + "," + randomCoordinates.maxLongitude + "," + randomCoordinates.maxLatitude + "," + "&limit=1";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            imgURL = data.data[0].thumb_1024_url;
            var coords = data.data[0].computed_geometry.coordinates;
            var x = coords[0];
            var y = coords[1];
            getCountryCodeByCoordinates(y, x, process.env.GEO_NAME)
                .then((countryCode) => {
                    if (countryCode == undefined) {
                        setImg();
                    } 
                    else {
                        iso = countryCode;
                        console.log(iso);

                        sendImage();
                    }
                });
        })
        .catch(error => {
            setImg();
        });
};




function getRandomCoordinate(min, max) {
    return Math.random() * (max - min) + min;
}
function generateRandomCoordinates() {
    const centerLatitude = getRandomCoordinate(-90, 90);
    const centerLongitude = getRandomCoordinate(-180, 180);
    const latitudeRange = 0.25;
    const minLatitude = Math.max(centerLatitude - latitudeRange / 2, -90);
    const maxLatitude = Math.min(centerLatitude + latitudeRange / 2, 90);
    const longitudeRange = 0.25;
    const minLongitude = (centerLongitude - longitudeRange / 2 + 180) % 360 - 180;
    const maxLongitude = (centerLongitude + longitudeRange / 2 + 180) % 360 - 180;


    return {
        centerLatitude,
        centerLongitude,
        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude,
    };
}

client.login(process.env.discord_token);