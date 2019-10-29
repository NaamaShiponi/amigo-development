

let mysql = require('mysql');
let UserInterfaceTable = require('./database-develop/googleSheets');
let classUserInterfaceTable = new UserInterfaceTable();

let CacheHandler = class {
  constructor() {
    this.sendMessage = null
    this.newUsers = this.newUsers.bind(this);
    this.pushAnswer = this.pushAnswer.bind(this);
    this.answer = this.answer.bind(this);
    this.posOrNegAnswer = this.posOrNegAnswer.bind(this)
    this.findTheQ = this.findTheQ.bind(this)
    this.questionWithoutAnswer = this.questionWithoutAnswer.bind(this)
  }
  questionWithoutAnswer(con,dialogue) {
    let a = con;
    a.query("select groupToEndPositive,groupToEndNegative from dialogues where number=" + dialogue, function (err, groupToEnd) {
      console.log(groupToEnd, "groupToEnd")
      if (err) console.log("err groupToEnd  dialogues", err);
      if (groupToEnd && groupToEnd.length != 0 ) {
        if(groupToEnd.groupToEndPositive==="0" && groupToEnd.groupToEndNegative==="0"){
          console.log("true 0")
        }else{
          console.log("fals 0")
        }
      }
      });
  }
  checkingIfSQL() {
    if (typeof this.con !== "undefined")
      if (!this.con._connectCalled) {
        console.log("oyy loo im not connected")
        this.con.connect(function (err) {
          if (err) throw err;
          console.log("Connected!");
        });
      }
      else {
        console.log("not need to connect")
      }
  }
  pushToSQL(con, id, text, cbSendMessage) {
    this.con = con
    // this.checkingIfSQL();
    let a = con;
    let self = this
    this.sendMessage = cbSendMessage;
    a.query("select idUser from searchId where idUser=" + id, function (err, result) {
      if (err) console.log("err pushToSQL searchId.idUser", err);
      console.log("select idUser", result)
      //User exist
      if (result && result.length != 0) {
        console.log("user exists");
        self.pushAnswer(a, id, text, (id, response, time, late) => a.query("update id_" + id + " set response='" + response + "' , response_time=" + time + " , late='" + late + "' order by id desc LIMIT 1", function (err, results) { if (err) console.log("err pushToSQL searchId.idUser", err); console.log("pushToSQL successful"); }))
      } else {
        self.newUsers(a, id, text)
        console.log("pushToSQL")
      }
    });
  }
  /*
  a=connction to mysql 
  function to save id telegram for users
  */
  newUsers(a, id, text) {
    this.checkingIfSQL();

    let self = this
    a.query("select phone from searchId where phone=" + text, function (err, phones) {
      if (err) console.log("err newUsers searchId.phone", err);
      if (!phones || phones.length === 0) {
        a.query("select phone from users where phone=" + text, function (err, phone) {
          if (err) console.log("err newUsers users.phone", err);
          if (phone && phone.length != 0) {
            a.query("insert into searchId (phone,idUser,idData) values (" + text + "," + id + ", 'id_" + id + "')");
            a.query("CREATE TABLE `id_" + id + "` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT,`date` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,`day` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,`dialogue` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,`message` varchar(1024) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,`response` varchar(1024) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,`response_time` TIME,`dead_linew` TIME,`late` varchar(225) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,PRIMARY KEY(`id`)) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", function (err, result) {
              if (err) console.log("err newUsers CREATE TABLE", err);
              self.sendMessage(id, "מעולה הצטרפת למערכת");
              a.query("select name from users where phone=" + text, function (err, name) {
                if (err) console.log("err newUsers users.name", err);
                console.log(phone)
                classUserInterfaceTable.getTableNameAndCreate("id_" + id, phone[0].phone);
              });
            });
          } else {
            self.sendMessage(id, ".במידה ואת/ה במערכת, שלח/י לי הודעה עם המספר האישי שהאחראי נתן לך");
          }
        });
      } else {
        self.sendMessage(id, "מספר הטלפון הזה כבר רשום");
      }
    });
  }
  /*
  function to push Answer
  */

  pushAnswer(a, id, text, cb) {
    this.checkingIfSQL();

    let self = this
    let dayPlusHour = null;
    let response = [];
    let date = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    date = new Date(date);
    a.query("select message from id_" + id + " WHERE ID = (SELECT MAX(ID) FROM amigo_development.id_" + id + ")", function (err, message) {
      if (err) console.log("err pushAnswer  id_.message", err);
      if (message) {
        a.query("select response from id_" + id + " WHERE ID = (SELECT MAX(ID) FROM amigo_development.id_" + id + ")", function (err, result) {
          if (err) console.log("err pushAnswer  id_.response", err);
          if (result && result.length != 0) {
            if (result[0].response === null) {

              response.push(text);
              // self.findTheQ(a, id, text)
              a.query("select * from id_" + id + " WHERE ID = (SELECT MAX(ID) FROM amigo_development.id_" + id + ")", function (err, results) {
                if (err) console.log("err pushAnswer  id_.*", err);
                if (results && results.length != 0 && results[0].dead_linew !== null && results[0].dateArr !== null) {
                  let dateArr = results[0].date.split(" ");
                  if (dateArr[1] == date.getDate()) {
                    let timea = results[0].dead_linew.split(":");
                    dayPlusHour = (parseInt(timea[0]) * 1000 + parseInt(timea[1])) - (parseInt(date.getHours()) * 1000 + parseInt(date.getMinutes()));
                    console.log("dayPlusHour", dayPlusHour)
                    if (dayPlusHour < 0) {
                      cb(id, response, "'" + date.getHours() + ":" + date.getMinutes() + ":00'", "V")
                      self.findTheQ(a, id, text, false)
                    } else { cb(id, response, "'" + date.getHours() + ":" + date.getMinutes() + ":00'", "X"); console.log("נכנס לX"); self.findTheQ(a, id, text, true) }
                  } else { cb(id, response, "'" + date.getHours() + ":" + date.getMinutes() + ":00'", "איחר ביום V"); self.findTheQ(a, id, text, false) }
                }
              });

            } else {
              response.push(result[0].response, text)
              a.query("update id_" + id + " set response='" + response + "' order by id desc LIMIT 1");
            }
          }
        });
      }
    });

  }
  /*
  function to send response
  */

  findTheQ(a, id, text, boolean) {
    this.checkingIfSQL();

    //למצוא את התשובות האפשריות
    //לעשות IF של תגובות חיוביות ושלליות
    console.log("findTheQ")
    let self = this
    let numberQ = null
    if (boolean == true) {
      a.query("select dialogue from id_" + id + " WHERE ID = (SELECT MAX(ID) FROM amigoTeacher.id_" + id + ")", function (err, dialogue) {
        if (err) console.log("err findTheQ id_.dialogue", err);
        if (dialogue && dialogue.length != 0 && dialogue[0].dialogue != null) {
          a.query("select sentencesIncluded from dialogues,groups where number=" + dialogue[0].dialogue + " and groupToOpen=numOfGroup", function (err, groupToOpen) {
            if (err) console.log("err findTheQ groups.sentencesIncluded", err);
            if (groupToOpen && groupToOpen.length != 0 && groupToOpen[0].sentencesIncluded != null) {
              let q = groupToOpen[0].sentencesIncluded.split(',')
              a.query("select message from id_" + id + " WHERE ID = (SELECT MAX(ID) FROM amigoTeacher.id_" + id + ")", function (err, message) {
                if (err) console.log("err findTheQ id_.message", err);
                if (message && message.length != 0 && message[0].message != null) {
                  a.query("select number from sentences where sentence='" + message[0].message + "'", function (err, numberSentences) {
                    if (err) console.log("err findTheQ sentences.number", err);
                    if (numberSentences && numberSentences.length != 0 && numberSentences[0].number != null) {
                      if (numberSentences.length != 1) {
                        for (let i = 0; i < numberSentences.length; i++) {
                          for (let j = 0; j < q.length; j++) {
                            if (numberSentences[i].number == q[j]) {
                              numberQ = q[j]
                              self.posOrNegAnswer(a, numberQ, text, id)
                              j = q.length
                              i = numberSentences.length
                            }
                          }
                        }
                      } else {
                        numberQ = numberSentences[0].number
                        self.posOrNegAnswer(a, numberQ, text, id)
                      }

                    }
                  });
                }
              });
            }
          });
        }
      });
    } else {
      setTimeout(function () { self.sendMessage(id, "אוקיי") }, 22000);
    }
  }

  posOrNegAnswer(a, numberQ, text, id) {
    this.checkingIfSQL();

    //למצוא אם זה שלילי או חיובי
    let self = this;
    let groupToEnd = "groupToEndPositive";
    let groupToEndNegative = false;
    let groupToEndPositive = false;
    let groupToEndEmergency = false;
    let emergency = false;
    console.log("in posOrNegAnswer")
    a.query("select negativeValues from sentences WHERE number='" + numberQ + "'", function (err, negative) {
      if (err) console.log("err posOrNegAnswer sentences.negativeValues", err);
      if (negative && negative.length != 0 && negative[0].negativeValues != null) {
        let splitNegative = negative[0].negativeValues.split(',')
        for (let i = 0; i < splitNegative.length; i++) {
          if (splitNegative[i] === text) {
            console.log("groupToEndNegative")
            groupToEnd = "groupToEndNegative"
          }
          groupToEndNegative = true
        }
        if (groupToEndPositive && groupToEndNegative && groupToEndEmergency) {
          self.answer(a, id, groupToEnd, emergency)
        }
      }
    })
    a.query("select positiveValues from sentences WHERE number='" + numberQ + "'", function (err, positive) {
      if (err) console.log("err posOrNegAnswer sentences.positiveValues", err);
      if (positive && positive.length != 0 && positive[0].positiveValues != null) {
        let splitPositive = positive[0].positiveValues.split(',')
        for (let i = 0; i < splitPositive.length; i++) {
          if (splitPositive[i] === text) {
            console.log("groupToEndPositive")
            groupToEnd = "groupToEndPositive"
          }
          groupToEndPositive = true
        }
        if (groupToEndPositive && groupToEndNegative && groupToEndEmergency) {
          self.answer(a, id, groupToEnd, emergency)
        }
      }
    });
    a.query("select emergencyValues from sentences WHERE number='" + numberQ + "'", function (err, positive) {
      if (err) console.log("err posOrNegAnswer sentences.emergencyValues", err);
      if (positive && positive.length != 0 && positive[0].emergencyValues != null) {
        let splitPositive = positive[0].emergencyValues.split(',')
        for (let i = 0; i < splitPositive.length; i++) {
          if (splitPositive[i] === text) {
            console.log("groupToEndPositive")
            groupToEnd = "groupToEndNegative"
            emergency = true
          }
          groupToEndEmergency = true
        }
        if (groupToEndPositive && groupToEndNegative && groupToEndEmergency) {
          self.answer(a, id, groupToEnd, emergency)
        }
      }
    });

  }

  answer(a, id, groupToEnd, Emergency) {
    this.checkingIfSQL();

    console.log("answer")
    //לשלוח את התשובה
    let self = this
    const bla = {
      reply_markup: JSON.stringify({
        resize_keyboard: false,
        one_time_keyboard: true,
        force_reply: false,
        selective: true,
        hide_keyboard: true,

      })
    };
    if (Emergency === true) {
      a.query("select phone from searchId WHERE idUser=" + id, function (err, phone) {
        if (err) console.log("err groupToEnd  searchId.phone", err);
        if (phone && phone.length != 0 && phone[0].phone != null) {
          a.query("select name from users WHERE phone=" + phone[0].phone, function (err, name) {
            if (err) console.log("err groupToEnd  users.name", err);
            if (name && name.length != 0 && name[0].name != null) {
              console.log("i'm hirr")
              self.sendMessage("735304368", "צריך לבדוק איך " + name[0].name + ", התשובה שהתקבלה דורשת התיחסות ");
              setTimeout(function () { self.sendMessage(id, "המטפל יצור איתך קשר בקרוב תשאר זמין", bla) }, 22000);
            }
          });
        }
      });
    } else {

      a.query("select dialogue from id_" + id + " WHERE ID = (SELECT MAX(ID) FROM amigoTeacher.id_" + id + ")", function (err, dialogue) {
        if (err) console.log("err answer  id_.dialogue", err);
        if (dialogue && dialogue.length != 0 && dialogue[0].dialogue != null) {
          a.query("select " + groupToEnd + " from dialogues where number=" + dialogue[0].dialogue, function (err, dialogueNumber) {
            console.log("dialogueNumber", dialogueNumber)
            if (err) console.log("err answer  dialogues.distinct", err);
            if (dialogueNumber && dialogueNumber.length != 0) {
              a.query("select sentencesIncluded from groups where numOfGroup=" + dialogueNumber[0][groupToEnd], function (err, groupToEnd) {
                if (err) console.log("err answer sentencesIncluded.groups groups.sentencesIncluded", err);
                if (groupToEnd && groupToEnd.length != 0 && groupToEnd[0].sentencesIncluded != null) {
                  let e = groupToEnd[0].sentencesIncluded.split(",");
                  let rand = e[Math.floor(Math.random() * e.length)]
                  a.query("select sentence from sentences WHERE number=" + rand, function (err, sentence) {
                    if (err) console.log("err answer sentences.sentence", err);
                    if (sentence && sentence.length != 0 && sentence[0].sentence != null) {
                      setTimeout(function () { self.sendMessage(id, sentence[0].sentence, bla) }, 22000);
                    }
                  });
                }
              });
            }
          });
        }
      });

    }
  }

}

module.exports = CacheHandler;
