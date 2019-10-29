process.env["NTBA_FIX_319"] = 1;
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
let mysql = require('mysql');
const TelegramBot = require('node-telegram-bot-api');
// const token = '713503075:AAFqtKVrBLeuro5zNdEhcSpnpJuw9sWR8h0'
const token = '826959178:AAE5fkUC2C0qaOldwN3W8_geiHLKWquxWDg';
const bot = new TelegramBot(token, { polling: true });
const googleSheets = require('../database-amigo/googleSheets');
let classGoogleSheets = new googleSheets();
const CacheHandler = require("../CacheHandler");
let classCacheHandler = new CacheHandler();

const mysqlCon = mysql.createConnection({
  host: "52.166.21.74",
  user: "root",
  password: "CarmelBot1010",
  database: "amigoTeacher"
});


mysqlCon.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");

  mysqlCon.query("select now()", function (err, result) {
    if (err) console.log(err);
  });		
});

// setInterval(function () {
//   if (!mysqlCon._connectCalled) {
//     mysqlCon.connect(function (err) {
//       if (err) throw err;
//       console.log("Connected!");
//     });
//   }
//   else{
//     console.log("not need to")
//   }
// }, 60000);

classGoogleSheets.workWithGoogleSheets(mysqlCon, bot);

bot.on('message', (msg) => {
  console.log("fight so dirty",msg)
  classCacheHandler.pushToSQL(mysqlCon, msg.chat.id, msg.text, (chatId, text,bla) => bot.sendMessage(chatId, text,bla))
});



