const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { v4: uuidv4 } = require('uuid');
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = 'testing0098bot';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log(BOT_USERNAME)
let users = {};
let usersHashMap = {};

// Start command handler
bot.onText(/\/start (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const token = match[1];
    const username = msg.from.username || msg.from.first_name;
    console.log(username,token,  users[token].user);
    if (token && users[token] && users[token].user === username) {
        users[token].chatId = chatId;
        usersHashMap[username] = token;
        bot.sendMessage(chatId, `Hello ${username}, you have successfully onboarded!`);
    } else {
        bot.sendMessage(chatId, "Invalid or missing token. Please use the correct onboarding link.");
    }
});

// Onboard endpoint
app.get("/", (req,res)=>{
    res.send("im in sir...");
})
app.post('/onboard', (req, res) => {
    const { username } = req.body;
    const user = username.split("@")[1];
    console.log(req.body);
    console.log("onborded here:....");

    if (!user) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Generate a unique token for the user
    const token = uuidv4();
    users[token] = { user, chatId: null };
    console.log("token: ",token," ,for user: ",user);

    // Create the onboarding URL
    const onboardingUrl = `https://t.me/${BOT_USERNAME}?start=${token}`;

    res.json({ onboardingUrl });
});

app.post('/checkUserName',(req,res)=>{
    const { username } = req.body;
    const user = username.split("@")[1];
    if(usersHashMap[user])
        res.json({status: true});
    else
        res.json({status: false});
})

// Send message endpoint
app.post('/webhook', (req, res) => {
    const { username, message, data } = req.body;
    const userName = username.split("@")[1];
    console.log(userName, message, data)

    if (!userName || !message) {
        return res.status(400).json({ error: 'Username and message are required' });
    }

    // Find the user by username
    
    if (!usersHashMap[userName]) {
        return res.status(404).json({ error: 'User not found or not onboarded' });
    }
    const user = users[usersHashMap[userName]];
    // Send the message
    const chat = `<b>I'm, ${message}</b>\n`+data;
    //split data in array of 5 elements 
    bot.sendMessage(user.chatId, chat,  { parse_mode: 'HTML' });

    res.json({ success: 'Message sent' });
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
