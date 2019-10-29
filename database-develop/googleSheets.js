const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const HandleSendingMSG = require('../HandleSendingMSG');
let events = require('events');
let mysql = require('mysql');
let eventEmitter = new events.EventEmitter();
let cCreat = false, qCreat = false, sCreat = false, uCreat = false, gCreat = false;
let classHandleSendingMSG;
var schedule = require('node-schedule-tz');
let mysqlCon;
let tableNameGlobal = {};
let nameGlobal;
let saveDBidData = [];
let saveDBspreadSheetId = [];
//googleSheets class created to enable passing functions and activate them from index.js
let googleSheets = class {
  workWithGoogleSheets(con, bot) {
    mysqlCon = con
    classHandleSendingMSG = new HandleSendingMSG(bot, con);
    schedule.scheduleJob("0 0 * * *",'Asia/Jerusalem', function () {
      console.log("im happning")
      fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), sheetToTable);
      });
      // fs.readFile('credentials.json', (err, content) => {
      //   if (err) return console.log('Error loading client secret file:', err);
      //   // Authorize a client with credentials, then call the Google Sheets API.
      //   authorize(JSON.parse(content), tableToSheet);
      // });
      fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), updateIDTables);
      });


    })
    // setInterval to check every hour if there is a new data to transfer 
    
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), sheetToTable);
    });


   
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), updateIDTables);
    });

    mysqlCon.query("select * from searchId", function (err, result, fields) {
      if (err) throw err;
      // console.log("result", result);
      let resultArr = JSON.parse(JSON.stringify(result));
      let dataIdArr = [];
      let spreadSheetIdArr = [];
      for (let i = 0; i < resultArr.length; i++) {
        delete resultArr[i].id;
        delete resultArr[i].phone;
        delete resultArr[i].idUser;
        // console.log("idGooleSheet",resultArr[i].idGoogleSheets);
        dataIdArr[i] = resultArr[i].idData;
        spreadSheetIdArr[i] = resultArr[i].idGoogleSheets;
      }
      saveDBidData = dataIdArr;
      console.log("workWithGoogleSheets saveDBidData dataIdArr", dataIdArr);
      saveDBspreadSheetId = spreadSheetIdArr;



    });
  }

  //receive newly created personal table and create one in googleSheets
  getTableNameAndCreate(createdTable, name) {
    console.log("in getTableNameAndCreate!!!", createdTable, name);   
    console.log("createdTable", createdTable, "name", name);
    tableNameGlobal = createdTable;
    nameGlobal = name;
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), addSheet);
    });
  }
} // end of class


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */

 
function sheetToTable(auth) {
console.log("in sheetToTable!!!");

  mysqlCon.query("DROP TABLE IF EXISTS dialogues, groups, schedule, sentences, users, groupByPeople", function (err, result) {
    if (err) console.log(err);
    console.log("dropped all tables");
  });

  let createDialoguesTable = "CREATE TABLE dialogues (id INT AUTO_INCREMENT PRIMARY KEY, number VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, groupToOpen VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, groupToEndPositive VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, groupToEndNegative VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci,notes VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci)";
  let createGroupsTable = "CREATE TABLE groups (id INT AUTO_INCREMENT PRIMARY KEY, numOfGroup VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, sentencesIncluded VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, notes VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci)";
  let createScheduleTable = "CREATE TABLE schedule (id INT AUTO_INCREMENT PRIMARY KEY, phone VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, day VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, hour TIME, until TIME, dialoguesGroup VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, numOfDialogueGroup VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, late TIME)";
  let createSentencesTable = "CREATE TABLE sentences (id INT AUTO_INCREMENT PRIMARY KEY, number VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, sentence VARCHAR(1024) CHARACTER SET utf8 COLLATE utf8_unicode_ci, positiveValues VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, negativeValues VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, emergencyValues VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci)";
  let createUsersTable = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, phone VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, name VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci)";
  let createGroupByPeopleTable = "CREATE TABLE groupByPeople (id INT AUTO_INCREMENT PRIMARY KEY, groupName VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, groupNum VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, groupMember VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci)";

  mysqlCon.query(createDialoguesTable, function (err, result) {
    if (err) console.log(err);
    console.log("dialogues table created");
  });
  mysqlCon.query(createGroupsTable, function (err, result) {
    if (err) console.log(err);
    console.log("groups table created");
  });
  mysqlCon.query(createScheduleTable, function (err, result) {
    if (err) console.log(err);
    console.log("schedule table created");
  });
  mysqlCon.query(createSentencesTable, function (err, result) {
    if (err) console.log(err);
    console.log("sentences table created");
  });
  mysqlCon.query(createUsersTable, function (err, result) {
    if (err) console.log(err);
    console.log("users table created");
  });
  mysqlCon.query(createGroupByPeopleTable, function (err, result) {
    if (err) console.log(err);
    console.log("GroupByPeople table created");
  });

  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.batchGet({
    spreadsheetId: '1J9WKxQV9G4K0v1SaLugSHdeUOMvrCjZV_OVtW65ddNo',//spreadSheetName: Amigo-teacher
    ranges: ["דיאלוגים!A2:E", "קבוצות!A2:C", "תזמונים!A2:G", "מאגר_משפטים!A2:E", "משתמשים!A2:B", "קבוצות_אנשים!A2:C"],
    majorDimension: 'ROWS',
    // valueRenderOption: 'UNFORMATTED_VALUE',
    // valueInputOption: 'USER_ENTERED',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);

    let insertToDialogues = "INSERT INTO dialogues (number,groupToOpen,groupToEndPositive,groupToEndNegative,notes) VALUES ?";
    let insertToGroups = "INSERT INTO groups (numOfGroup, sentencesIncluded, notes) VALUES ?";
    let insertToSchedule = "INSERT INTO schedule (phone, day, hour, until, dialoguesGroup, numOfDialogueGroup, late) VALUES ?";
    let insertToSentences = "INSERT INTO sentences (number, sentence, positiveValues,negativeValues, emergencyValues) VALUES ?";
    let insertToUsers = "INSERT INTO users (phone, name) VALUES ?";
    let insertToGroupByPeople = "INSERT INTO groupByPeople (groupName, groupNum, groupMember) VALUES ?";

    let dialoguesValues = res.data.valueRanges[0].values;
    let groupsValues = res.data.valueRanges[1].values;
    let scheduleValues = res.data.valueRanges[2].values;
    let sentencesValues = res.data.valueRanges[3].values;
    let usersValues = res.data.valueRanges[4].values;
    let groupByPeopleValues = res.data.valueRanges[5].values;

    // console.log("usersValues", usersValues);

    mysqlCon.query(insertToDialogues, [dialoguesValues], function (err, result) {
      if (err) console.log("insertToDialogues", err);
      console.log("Number of records inserted to dialogues: " + result.affectedRows);
      cCreat = true;
      everythingIsUpdated();
    });
    mysqlCon.query(insertToGroups, [groupsValues], function (err, result) {
      if (err) console.log("insertToGroups", err);
      console.log("Number of records inserted to groups: " + result.affectedRows);
      qCreat = true;
      everythingIsUpdated();
    });
    mysqlCon.query(insertToSchedule, [scheduleValues], function (err, result) {
      if (err) console.log("insertToSchedule", err);
      console.log("Number of records inserted to schedule: " + result.affectedRows);
      sCreat = true;
      everythingIsUpdated();
    });
    mysqlCon.query(insertToSentences, [sentencesValues], function (err, result) {
      if (err) console.log("insertToSentences", err);
      console.log("Number of records inserted to sentences: " + result.affectedRows);
    });
    mysqlCon.query(insertToUsers, [usersValues], function (err, result) {
      if (err) console.log("insertToUsers", err);
      console.log("Number of records inserted to users: " + result.affectedRows);
      uCreat = true;
      everythingIsUpdated();
    });
    mysqlCon.query(insertToGroupByPeople, [groupByPeopleValues], function (err, result) {
      if (err) { console.log("insertToGroupByPeople", err); };
      gCreat = true;
      everythingIsUpdated();

      console.log("Number of records inserted to group by people: " + result.affectedRows);
    });
  });
}

function everythingIsUpdated() {
    if (uCreat && sCreat && qCreat && cCreat && gCreat) {
      console.log("everythingIsUpdated! Send event");
      // eventEmitter.emit('thereBeenChangeDB');
      classHandleSendingMSG.changesonDB();
      uCreat = false;
      sCreat = false;
      qCreat = false;
      cCreat = false;
      gCreat = false;
    }
}


let globalArrForRequestreportsSummery = [];
let globalArrForRequestTableName = [];
let globalArrForRequestID8300 = [];
let globalArrForRequestID428 = [];
// console.log("globalArrForRequestreportsSummery creation", globalArrForRequestreportsSummery);
// console.log("globalArrForRequestID735 creation", globalArrForRequestID735);
// console.log("globalArrForRequestID8300 creation", globalArrForRequestID8300);
// console.log("globalArrForRequestID428 creation", globalArrForRequestID428);

// function tableToSheet(auth) {
//   mysqlCon.query("select * from reportsSummery", function (err, result, fields) {
//     if (err) console.log(err);
//     // console.log("result", result);
//     // needsResultData(result, auth);
//     let resultArr = JSON.parse(JSON.stringify(result));

//     let arr = [];
//     for (let i = 0; i < resultArr.length; i++) {
//       delete resultArr[i].id;
//       arr[i] = Object.values(resultArr[i]);
//     }
//     globalArrForRequestreportsSummery = arr;
//     // console.log("globalArrForRequestreportsSummery before request const", globalArrForRequestreportsSummery);

//     const request = {
//       spreadsheetId: '1meUM-8BT6j_6yy9BkZ2brkJX0sLLeHERJg1ZHY76RpQ',
//       range: 'דוחות_מסכמים!A2:G',
//       valueInputOption: 'USER_ENTERED',
//       resource: {
//         "majorDimension": "ROWS",
//         "values": globalArrForRequestreportsSummery
//       },
//     }
//     const sheets = google.sheets({ version: 'v4', auth });
//     sheets.spreadsheets.values.update(request, (err, res) => {
//       if (err) return console.log('The API returned an error: ' + err);
//     });
//   });
// }

function addSheet(auth) {
  console.log("in add sheet!!!!");

  mysqlCon.query("describe " + tableNameGlobal, function (err, result) {
    if (err) console.log(err);
    saveDBidData.push(tableNameGlobal);
    console.log("addSheet saveDBidData tableNameGlobal", tableNameGlobal);
    console.log("addSheet saveDBidData", saveDBidData);
    // console.log("result from add describe ", result); //RowDataPacket
    let resultArr = JSON.parse(JSON.stringify(result));
    // console.log("resultArr from add describe ", resultArr);
    let arr = [];
    let columnsArr = [];
    for (let i = 0; i < resultArr.length; i++) {
      // delete resultArr[i].id;
      arr[i] = Object.values(resultArr[i]);
      columnsArr[i] = arr[i][0];
      // console.log("arr[i][]", arr[i][0]);
    }
    // console.log("columnsArr[0][0]",columnsArr[0]);
    // delete columnsArr[0];
    // console.log("columnsArr from add describe ", columnsArr);

    let sheets = google.sheets('v4');
    sheets.spreadsheets.create({
      auth: auth,
      resource: {
        properties: {
          title: nameGlobal
        }
      }
    }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      } else {
        // sheets.spreadsheets.values.update(request, (err, res) => {
        //   if (err) return console.log('The API returned an error: ' + err);
        // });//The API returned an error: Error: Login Required.
        saveDBspreadSheetId.push(response.data.spreadsheetId);
        console.log("response.data.spreadsheetId", response.data.spreadsheetId);
        mysqlCon.query("update searchId set idGoogleSheets='" + response.data.spreadsheetId + "' where idData='" + tableNameGlobal + "'");
        passDataToCreatedTable(response.data.spreadsheetId, columnsArr, tableNameGlobal, auth);
        // console.log("arr in create", arr);
        console.log("response", response.data.spreadsheetId);
        console.log("Added");
      }
    });
  });
}

function passDataToCreatedTable(id, arr, tableNameFunc, auth) {
  console.log("in passDataToCreatedTable!!!", id);
  console.log("passDataToCreatedTable tableNameFunc", tableNameFunc);
  console.log("passDataToCreatedTable arr", arr);
  const request = {
    spreadsheetId: id,
    range: 'A1:K',
    valueInputOption: 'USER_ENTERED',
    resource: {
      "majorDimension": "ROWS",
      "values": [arr]
    }
  }
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.update(request, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
  });
}

function updateIDTables(auth) {
  console.log("in updateIDTables!!!");
  console.log("updateIDTables saveDBidData", saveDBidData);

  if (saveDBidData.length != 0) {
    for (let i = 0; i < saveDBidData.length; i++) {
      mysqlCon.query("select * from " + saveDBidData[i], function (err, result, fields) {
        if (err) console.log(err);
        // console.log("result", result);
        // needsResultData(result, auth);
        let resultArr = JSON.parse(JSON.stringify(result));
        let arr = [];
        for (let i = 0; i < resultArr.length; i++) {
          // delete resultArr[i].id;
          arr[i] = Object.values(resultArr[i]);
        }
        globalArrForRequestTableName = arr;
        // console.log("globalArrForRequestTableName before request const", globalArrForRequestTableName);
        let spreadsheetID = saveDBspreadSheetId[i];
        const request = {
          spreadsheetId: spreadsheetID,
          range: 'A2:K',
          valueInputOption: 'USER_ENTERED',
          resource: {
            "majorDimension": "ROWS",
            "values": globalArrForRequestTableName
          },
        }
        console.log("updateIDTables values after request", globalArrForRequestTableName);
        const sheets = google.sheets({ version: 'v4', auth });
        sheets.spreadsheets.values.update(request, (err, res) => {
          if (err) return console.log('The API returned an error: ' + err);
        });
      });
    }
  } else {
    console.log("nothing new on saveDBidData! ");
  }
}

module.exports = googleSheets;
