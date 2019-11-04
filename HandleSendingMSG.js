let mysql = require('mysql');
var schedule = require('node-schedule');
//var scheduleTZ = require('node-schedule-tz');
const TelegramBot = require('node-telegram-bot-api');
const token = '933304400:AAHMTQx-L2Q7uDTeDG9S0ayjkaKKeAWnPOc';

//706238416

let HandleSendingMSG = class {
  constructor(bot, mysqlCon) {
    this.mysqlCon = mysqlCon;
    this.bot = bot;
    this.persons = [];
    this.personsRH = [];
    this.sch;
    this.count = 0;
    this.groupsofS = this.groupsofS.bind(this);
    this.changesonDB = this.changesonDB.bind(this);
    this.randomTheHours = this.randomTheHours.bind(this);
    this.msgFromStock = this.msgFromStock.bind(this);
    this.schForNextTime = this.schForNextTime.bind(this);
    this.sendingTheMsg = this.sendingTheMsg.bind(this);
    this.groupsOfPersons = this.groupsOfPersons.bind(this);
  }
checkingIfSQL(){
  if (! this.mysqlCon._connectCalled) {
      mysqlCon.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
      });
    }
    else{
      console.log("not need to connect")
    }
}
/*
"הפונקציה הזאתי בודקת מי האנשים הבאים שהשעת התחלה שלהם היא הבאה בתור 

*/
  schedulerNextOne() {
    this.checkingIfSQL();
    let date = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    date = new Date(date);
    let dayPlusHourOfToday = date.getDay() * 10000 + date.getHours() * 100 + date.getMinutes() + 1;
    console.log("dayPlusHourOfToday",date.getDay())
    let thePerson;
    this.persons = [];
    let self = this;

    this.mysqlCon.query("SELECT * FROM schedule", function (err, result, fields) {
      if (err)  console.log("err schedulerNextOne",err) ; 
      result.map((person)=>{
       // היא בהתחלה לוקחת את כל התזמונים שמופיע בהם יותר מיום אחד ומחליפה אותם אם אחד מהימים שווה לאותו יום שהיום

        let days = person.day.split('/');
       // console.log("person",person)
        if(days.length >1)
        {
         person.day= "ח";
         for( let i=0; i<days.length;i++){

          let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
       //   console.log("days",days[i])
          for (let j = 0; j < arrDay.length; j++) {
            //console.log("days",days[i],arrDay[j])

            if (days[i] == arrDay[j])
            days[i] = j;

              if(date.getDay()== days[i]){
              //  console.log("im getting in")
              person.day= days[i];}
          }

         }
        
        }
      })
      //היא בודקת אם השעת התחלה קודמת לשעת האחרונה
      result= result.filter(lastHourlaterthenStart)
      function lastHourlaterthenStart(person) {
        let   a = person.hour.split(":");
        let startHour = parseInt(a[0]) * 100 + parseInt(a[1]) ;
     let  b = person.until.split(":");
        let lastHour = parseInt(b[0]) * 100 + parseInt(b[1]) ;
       

          if((lastHour-startHour)>=0){
          
          return  person ;}
        
      }

 //בודקת איזה בנאדם הכי קרוב לשעה עכשווית 
     let arrayOfTime = result;

      let Timedifference = 100000;
      
      for (let i = 0; i < arrayOfTime.length; i++) {
        let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
        for (let j = 0; j < arrDay.length; j++) {

          if (arrayOfTime[i].day == arrDay[j])
            arrayOfTime[i].day = j;
        }
        let a = [];
        a = arrayOfTime[i].hour.split(":");

        let dayPlusHour = parseInt(a[0]) * 100 + parseInt(a[1]) + arrayOfTime[i].day * 10000;

        if ((dayPlusHour - dayPlusHourOfToday < Timedifference) && (dayPlusHour - dayPlusHourOfToday >= 0)) {
          Timedifference = dayPlusHour - dayPlusHourOfToday;
          thePerson = arrayOfTime[i];

        }

      }
// אם שום בנאדם לא נמצא זה אומר שהתחיל שבוע חדש ומריצים את הבדיקה שהשעה התחליתית היא חצות ביום א
      if (typeof thePerson === "undefined") {

        let Timedifference1 = 1000000;
        let dayPlusHourOfNextDay = 0;
        for (let i = 0; i < arrayOfTime.length; i++) {
          let a = [];
          let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
          for (let j = 0; j < arrDay.length; j++) {

            if (arrayOfTime[i].day == arrDay[j])
              arrayOfTime[i].day = j;
          }
          a = arrayOfTime[i].hour.split(":");
          let dayPlusHour = parseInt(a[0]) * 100 + parseInt(a[1]) + arrayOfTime[i].day * 10000;

          if ((dayPlusHour - dayPlusHourOfNextDay < Timedifference1) && (dayPlusHour - dayPlusHourOfNextDay >= 0)) {
            Timedifference1 = dayPlusHour - dayPlusHourOfNextDay;
            thePerson = arrayOfTime[i];

          }


        }
      }
      // מוצאים את שאר האנשים שיש להם את אותה שעת התחלה כמו האדם הקרוב ביותר ודוחפים למערך
      self.persons = [];
      for (let i = 0; i < arrayOfTime.length; i++) {
        let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
        for (let j = 0; j < arrDay.length; j++) {

          if (arrayOfTime[i].day == arrDay[j])
            arrayOfTime[i].day = j;
        }
        let b = arrayOfTime[i].hour.split(":");
        let dayPlusHour = parseInt(b[0]) * 100 + parseInt(b[1]) + arrayOfTime[i].day * 10000;
        let c = thePerson.hour.split(":");
        let thePersonTime = parseInt(c[0]) * 100 + parseInt(c[1]) + thePerson.day * 10000;

        if (thePersonTime === dayPlusHour) {
          if (arrayOfTime[i].late == null) {
            arrayOfTime[i].late = "23:59:00";
          }

          self.persons.push(arrayOfTime[i]);
        }
      }


      self.randomTheHours();

    })
  }
//עושים לכל אחד מהאנשים שעה רנדומלית 
  randomTheHours() {
    let personsRandom = this.persons;
    personsRandom.map(personRandom => {

      let b = personRandom.hour.split(":");
      let hour = parseInt(b[0]) * 60 + parseInt(b[1]);
      let a = personRandom.until.split(":");

      let late = parseInt(a[0]) * 60 + parseInt(a[1]);
      let diffrent = late - hour;
      let random = Math.floor(Math.random() * diffrent);
      let randomH = Math.floor(random / 60) + parseInt(b[0]);
      let randomM = Math.floor(random % 60) + parseInt(b[1]);
     // console.log("print")
      
      if (randomM > 60) {
        randomM = randomM % 60;
      }
      if(randomM< parseInt(b[1]))
     { //console.log("ahhhh111",randomM,parseInt(b[1]))
      randomH++;}
      if (randomH < 10)
        randomH = "0" + randomH;
      if (randomM < 10)
        randomM = "0" + randomM;


      personRandom.hourRandom = randomH + ":" + randomM + ":" + "00";

    })
    this.persons = personsRandom;
    let date = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    // date = new Date(date);
    this.dialoges();


  }
//  אוספים מטבלת הדיאלוגים את כל המידע 
  dialoges() {
    this.checkingIfSQL();
    let self = this;
    let personsLength = 0;
    for (let i = 0; i < this.persons.length; i++) {

      let q = "select * from  " + "`" + "dialogues" + "`" + " where number=" + `"` + this.persons[i].numOfDialogueGroup + `"`;
      this.mysqlCon.query(q, function (err, result, fields) {
        if (err) console.log("err dialoges",err);
        self.persons[i].groupToOpen = "";
        self.persons[i].goodButtons ="";
        self.persons[i].badButtons ="";
        if (result && result.length != 0) {

          self.persons[i].groupToOpen=result[0].groupToOpen;
          self.persons[i].goodButtons=result[0].goodButtons;
          self.persons[i].badButtons=result[0].badButtons;

        }
        personsLength++;
        // }
        if (personsLength === self.persons.length) {
          self.groupsofS();
        }

      })
    }
  }
  //הולכת לקבוצות ומקבוצת הפתיחה שלקחה מהדיאולוגם מגרילה מספר בעצם משפט שנשלח לבנאדם 
  groupsofS() {
    this.checkingIfSQL();

    let self = this;
    let personsLength = 0;

    for (let i = 0; i < this.persons.length; i++) {

      let q = "select sentencesIncluded from  " + "`" + "groups" + "`" + " where numOfGroup=" + `"` + this.persons[i].groupToOpen + `"`;
      this.mysqlCon.query(q, function (err, result, fields) {
        if (err) console.log("err groupsofS",err);
        let sentences = " ";
        if (result && result.length != 0) {

          sentences= result[0].sentencesIncluded;}
        
        let a = sentences.split(",");
        let msg = a[Math.floor(Math.random() * a.length)];
        self.persons[i].msgNum = msg;

        personsLength++;
        if (personsLength === self.persons.length) {
          self.msgFromStock();
        }
      })
    }
  }
  // הולכת למאגר משפטים ולוקחת את המשפט וכפתורים עם התשובות שלו
  msgFromStock() {
    this.checkingIfSQL();

    let self = this;
    let personsLength = 0;

    for (let i = 0; i < this.persons.length; i++) {

      let q = "select *  from  " + "`" + "sentences" + "`" + " where number=" + `"` + this.persons[i].msgNum + `"`;
      this.mysqlCon.query(q, function (err, result, fields) {
        if (err) console.log("err msgFromStock",err);
        self.persons[i].sentence = "";
        self.persons[i].positiveValues = "";
        self.persons[i].negativeValues = "";
        self.persons[i].emergencyValues = "";
        if (result && result.length != 0) {

        self.persons[i].sentence=result[0].sentence;
        if(result[0].positiveValues!=='w')
        self.persons[i].positiveValues=result[0].positiveValues;
        if(result[0].negativeValues!=='w')
          self.persons[i].negativeValues=result[0].negativeValues;
          if(result[0].emergencyValues!=='w')
          self.persons[i].emergencyValues=result[0].emergencyValues;
        }
        personsLength++;
        if (personsLength === self.persons.length) {
         self.buttonsA();
        }
      })
    }
  }
 
 
  // לוקחת את התשובות שאמורות להופיע בכפתורים ומסדרת אותם לפי גודל ומכניסה שניים לתוך אותה שורה אם שתיי המילים קצרות
 //ומכניסה אותם לתוך אובייקט כדי שיופעו בצורת כפתורים
  buttonsA (){

    for (let i = 0; i < this.persons.length; i++) {
      const opts = {
    
        reply_markup: JSON.stringify({
            hide_keyboard: true,
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: false,
            selective: true,
            keyboard: [ ['Level 1'],['Level 2'] ]
        })
    };
    this.persons[i].buttons=this.persons[i].positiveValues+","+this.persons[i].negativeValues;
    if(this.persons[i].emergencyValues!="")
    this.persons[i].buttons=this.persons[i].buttons+","+this.persons[i].emergencyValues;
    this.persons[i].buttons=this.persons[i].buttons.split(",");
    this.persons[i].opts="";
    this.persons[i].buttonKeyboard=[];
     if( this.persons[i].buttons.length !=0){
//
if (this.persons[i].buttons.length >4){
  
  let buttons=this.persons[i].buttons.sort(function (a, b) { //sort by stage
    if (a.length < b.length)
        return -1
    if (a.length > b.length)
        return 1
    return 0 //default return value (no sorting)
})
let buttonsShort= buttons.filter(button => button.length < 14);
let buttonsLong= buttons.filter(button => button.length > 14);

if(buttonsShort.length%2 !=0&&buttonsShort.length>2)
  buttonsLong.push(buttonsShort.pop());
for (let j = 0; j < buttonsShort.length; j+=2) {

  let buttonArray=[]

  buttonArray.push(buttonsShort[j])   
   buttonArray.push(buttonsShort[j+1])
   this.persons[i].buttonKeyboard.push(buttonArray);



}
for (let j = 0; j < buttonsLong.length; j++) {
  let buttonArray=[]
  buttonArray.push(buttonsLong[j])   
   
   this.persons[i].buttonKeyboard.push(buttonArray);


}



}
else
{
//
      for (let j = 0; j < this.persons[i].buttons.length; j++) {
        let buttonArray=[]
         buttonArray.push(this.persons[i].buttons[j])
         if(this.persons[i].buttons[j]!==""&&this.persons[i].buttons[j]!=='w')
         this.persons[i].buttonKeyboard.push(buttonArray);
      }
    }
        //opts.keyboard=buttonArray
        if(this.persons[i].buttonKeyboard!=[]){

        this.persons[i].opts={
  
          reply_markup: JSON.stringify({
              resize_keyboard: true,
              one_time_keyboard: false,
              force_reply: false,
              selective: true,
              keyboard: this.persons[i].buttonKeyboard
          })
      };;}
      


     }
    //  console.log("this.persons[i].opts",this.persons[i].opts)
    }
   this.groupsOfPersons();


  }
  // לוקחים את המספר זיהוי מהדיאולוגים ובודקים אם הוא קבוצה או טלפון  
  // אם הוא קבוצה הולכים לטבלת הקבוצות ואוספים משמה את מספרי הזהוי של כל האנשים בקבוצה
  groupsOfPersons() {
    this.checkingIfSQL();

    let self = this;
    let personsLength = 0;
    let newPpersons = [];
    let indexDelete = [];

    for (let i = 0; i < self.persons.length; i++) {
      if (self.persons[i].phone.includes("G")) {
        self.persons[i].phone = self.persons[i].phone.replace("G", "");
        console.log("GGGGGG",self.persons[i].phone);
        let q = "select * from  " + "`" + "groupByPeople" + "`" + " where groupNum=" + `"` + self.persons[i].phone + `"`;
        this.mysqlCon.query(q, function (err, result, fields) {
          if (err) 
          console.log("err cant find this group", err);
          else
        {  indexDelete.push(i);
          let phoneNumbers = result;
          phoneNumbers.forEach(obj => {
            let phoneNum = obj.groupMember;
            let person = { ...self.persons[i] };
            person.phone = "P"+phoneNum;
            newPpersons.push(person);
          });
}
          personsLength++;

          if (personsLength === self.persons.length) {
            for (let j = 0; j < indexDelete.length; j++) {
              self.persons.slice(indexDelete[j], 1);
            }
            if(newPpersons.length!=0)
            self.persons={...newPpersons};
            console.log("GGGGG2222",self.persons)
           // return self.fromPhoneNumToIdUser();
           self.checkingNoDuplicates();
           self.schTheSending();
           self.schForNextTime();
          }

        })
      }
      else {
        personsLength++;

        
       }
      if (personsLength === self.persons.length) {
        for (let j = 0; j < indexDelete.length; j++) {
          self.persons.slice(indexDelete[j], 1);
        }
      //  console.log("shaneless 1", self.persons)
        if(newPpersons.length!==0)
        self.persons={...newPpersons};
     //   console.log("shaneless 2", self.persons)
         self.checkingNoDuplicates();
         self.schTheSending();
         self.schForNextTime();
       // self.fromPhoneNumToIdUser();

      }
    }
  }
  
  
  
  
  // groupsOfPersons() {
  //   this.checkingIfSQL();

  //   let self = this;
  //   let personsLength = 0;
  //   let newPpersons = [];
  //   let indexDelete = [];
  //   for (let i = 0; i < self.persons.length; i++) {
  //     if (self.persons[i].phone < 8) {
  //       let q = "select * from  " + "`" + "groupByPeople" + "`" + " where groupNum=" + `"` + self.persons[i].phone + `"`;
  //       this.mysqlCon.query(q, function (err, result, fields) {
  //         if (err) console.log("err msgFromStock", err);
  //         indexDelete.push(i);
  //         let phoneNumbers = result;
  //         phoneNumbers.forEach(obj => {
  //           let phoneNum = obj.groupMember;
  //           let person = { ...self.persons[i] };
  //           person.phone = phoneNum;
  //           newPpersons.push(person);
  //         });

  //         personsLength++;

  //         if (personsLength === self.persons.length) {
  //           for (let j = 0; j < indexDelete.length; j++) {
  //             self.persons.slice(indexDelete[j], 1);
  //           }
            
  //           self.persons={...newPpersons};
  //           return self.fromPhoneNumToIdUser();

  //         }

  //       })
  //     }
  //     else {

  //       personsLength++;
  //     }
  //     if (personsLength === self.persons.length) {
  //       self.fromPhoneNumToIdUser();

  //     }
  //   }
  // }
  // ממרים את כל המספרי הזיהוי שלקחנו למספר הזהות של הצאט בטלגראם
  fromPhoneNumToIdUser() {
    console.log("out out",)
    this.checkingIfSQL();

    // this.persons= Object.values(this.persons)
    let self = this;
    let personsLength = 0;
    let arrDeleteOfP = [];
    //sendingP
  //  console.log("kol ze bishvilanu",this.sendingP)
    for (let i = 0; i < this.sendingP.length; i++) {
      if (self.sendingP[i].phone.includes("P")) {
        self.sendingP[i].phone = self.sendingP[i].phone.replace("P", "");
      
      let q = "select idUser from  " + "`" + "searchId" + "`" + " where phone=" + `"` + self.sendingP[i].phone + `"`;

      this.mysqlCon.query(q, function (err, result, fields) {
        if (err) console.log("err fromPhoneNumToIdUser", err);
        let questions = result;
        console.log("result @",result,q)
      if(result.length!==0 &&result)
        self.sendingP[i].phoneId = result[0].idUser;
        else
          arrDeleteOfP.push(i)
        personsLength++;
        if (personsLength === self.sendingP.length) {
        
          //self.personsRH = self.personsRH.concat(self.persons);
         
     // console.log("person nasicha 1",self.sendingP)

      self.realySendMsg();

        //  self.schTheSending();
        //  self.schForNextTime();
        }
      })
    }
    else
{      personsLength++;

        if (personsLength === self.sendingP.length) {
          
      //     let inthepersonsRH=true;
      // for(let j =0;j<self.persons.length;j++ ){
      //   inthepersonsRH=true;
      //   for(let u =0;u<self.personsRH.length;u++ ){
      //     if((self.personsRH[u].phone==self.persons[j].phone)&&(self.personsRH[u].day==self.persons[j].day)&&(self.personsRH[u].hour==self.persons[j].hour)&&(self.personsRH[u].numOfDialogueGroup==self.persons[j].numOfDialogueGroup)&&(self.personsRH[u].until==self.persons[j].until)&&(self.personsRH[u].late==self.persons[j].late)  )
      //     inthepersonsRH=false;
      //     }
      //     if(inthepersonsRH) {
      //     let person={...self.persons[j]};

      //     self.personsRH.push(person)
        
      //   }
      // }
     // console.log("person nasicha 2",)
//////////////////////////////////////////////////////////////////////////////////////////
self.realySendMsg();
         // self.schTheSending();
         // self.schForNextTime();
        }
}

    }

  }
  checkingNoDuplicates (){
    this.persons= Object.values(this.persons)

    let self= this;
    let inthepersonsRH=true;
    for(let j =0;j<self.persons.length;j++ ){
     inthepersonsRH=true;
     for(let u =0;u<self.personsRH.length;u++ ){
        if((self.personsRH[u].phone==self.persons[j].phone)&&(self.personsRH[u].day==self.persons[j].day)&&(self.personsRH[u].hour==self.persons[j].hour)&&(self.personsRH[u].numOfDialogueGroup==self.persons[j].numOfDialogueGroup)&&(self.personsRH[u].until==self.persons[j].until)&&(self.personsRH[u].late==self.persons[j].late)  )
        inthepersonsRH=false;
       }
       if(inthepersonsRH) {
       let person={...self.persons[j]};
       self.personsRH.push(person);
     }
    }
  }
// הפעם הבאה שצריך לעבור על הטבלה ולקחת את האנשים הבאים בתור אליהם צריך להישלח ההודעה
  schForNextTime() {

    let time = this.persons[0].hour.split(":");
    let hour=parseInt(time[0]);
    hour=hour.toString();
    let minute = time[1];
    let day = this.persons[0].day;
    let timeS = minute + ' ' + hour + ' * * ' + day;
    console.log("timeS",timeS)
    let self = this;
    let date = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    // date = new Date(date);
    if ((typeof self.schNextTime != "undefined") && (self.schNextTime !== null))
      this.schNextTime.cancel();
    console.log("schNextTime", timeS, date);

    //if(typeof self.schNextTime !== "undefined"){
    let rule = new schedule.RecurrenceRule();
    rule.dayOfweek = day;
    rule.hour = hour;
    rule.minute = minute;
    rule.tz = 'Asia/Jerusalem';
    this.schNextTime = schedule.scheduleJob(rule, /*'Asia/Jerusalem',*/ function () {
      self.changesonDB();
    })
  }
  //אנשים שהשעה הרנדומלית שלהם היא הקרובה ביותר 
  schTheSending() {
   
  console.log("schTheSending");
 // console.log("self.sendingP 4",this.personsRH)

    let date = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    date = new Date(date);
    let dayPlusHourOfToday = date.getDay() * 10000 + date.getHours() * 100 + date.getMinutes() + 1;
    let thePerson;
    let self = this;

    let Timedifference = 1000000;
    for (let i = 0; i < self.personsRH.length; i++) {
      let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
      for (let j = 0; j < arrDay.length; j++) {

        if (self.personsRH.day == arrDay[j])
          self.personsRH[i].day = j;
      }
      let a = [];
      a = self.personsRH[i].hourRandom.split(":");

      let dayPlusHour = parseInt(a[0]) * 100 + parseInt(a[1]) + self.personsRH[i].day * 10000;

      if ((dayPlusHour - dayPlusHourOfToday < Timedifference) && (dayPlusHour - dayPlusHourOfToday >= 0)) {
        Timedifference = dayPlusHour - dayPlusHourOfToday;
        thePerson = self.personsRH[i];

      }

    }
    if (typeof thePerson === "undefined") {

      let Timedifference1 = 1000000;
      let dayPlusHourOfNextDay = 0;
      for (let i = 0; i < self.personsRH.length; i++) {
        let a = [];
        let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
        for (let j = 0; j < arrDay.length; j++) {

          if (self.personsRH[i].day == arrDay[j])
            self.personsRH[i].day = j;
        }
        a = self.personsRH[i].hourRandom.split(":")
        let dayPlusHour = parseInt(a[0]) * 100 + parseInt(a[1]) + self.personsRH[i].day * 10000;

        if ((dayPlusHour - dayPlusHourOfNextDay < Timedifference1) && (dayPlusHour - dayPlusHourOfNextDay >= 0)) {
          Timedifference1 = dayPlusHour - dayPlusHourOfNextDay;
          thePerson = self.personsRH[i];

        }


      }
    }
    if ((typeof self.sch != "undefined") && (self.sch !== null))
      this.sch.cancel();
    //self.sch=null;
    self.sendingP = [];
    for (let i = 0; i < self.personsRH.length; i++) {
      let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
      for (let j = 0; j < arrDay.length; j++) {

        if (self.personsRH[i].day == arrDay[j])
          self.personsRH[i].day = j;
      }
      let b = self.personsRH[i].hourRandom.split(":");
      let dayPlusHour = parseInt(b[0]) * 100 + parseInt(b[1]) + self.personsRH[i].day * 10000;
      let c = thePerson.hourRandom.split(":");
      let thePersonTime = parseInt(c[0]) * 100 + parseInt(c[1]) + thePerson.day * 10000;

      if (thePersonTime === dayPlusHour) {
        if (self.personsRH[i].late == null) {
          self.personsRH[i].late = "23:59:00";
        }

        self.personsRH[i].index = i;


        self.sendingP.push(self.personsRH[i]);
      }
    }
   // console.log("self.sendingP 123",self.personsRH)
    this.sendingTheMsg();
  }
  // שולחת את ההודעות לכל האנשים שהגיע השעה הרנדומלית שנקבעה להם מוחקת אותם ממערך המחכים בתור לשליחה
  sendingTheMsg() {
    this.checkingIfSQL();

   // console.log("sendingTheMsg 45",this.sendingP);

    
    
    let time = this.sendingP[0].hourRandom.split(":");
    let hour=parseInt(time[0]);
    hour=hour.toString();
    let minute = time[1];
    let day = this.sendingP[0].day;
    let timeS = minute + ' ' + hour + ' * * ' + day;
    let self = this;
    let date6 = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    let date7 = new Date(date6);
    
  
    console.log("set timer to", timeS, "count:", this.count );
    let arrindexOfDelete =[];
    console.log("time is", timeS);
    console.log("time now is", date6);

    let rule = new schedule.RecurrenceRule();
    rule.dayOfweek = day;
    rule.hour = hour;
    rule.minute = minute;
    rule.tz = 'Asia/Jerusalem';
      this.sch = schedule.scheduleJob(rule, /*'Asia/Jerusalem',*/ function () {
        console.log("time is", timeS);
        self.fromPhoneNumToIdUser();
        //ךקרוא אחכ לריילי טיימ סנד

    });

  }
  realySendMsg() {
    let arrindexOfDelete =[];

    let date6 = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    let date7 = new Date(date6);
    let self=this;
    let personLength=0;
    self.sendingP.map((person) => {
      
      let msg = person.sentence;
      self.count++;
       console.log("sendMessage",person.phoneId, msg,person.opts.reply_markup);
       if(person.opts=="")
      self.bot.sendMessage(person.phoneId, msg)
      else
      self.bot.sendMessage(person.phoneId,msg, person.opts)

      if (person.late == null) {
        person.late = "23:59:00";
      }
      let b = person.hourRandom.split(":");
   

   let date4= date7.toUTCString().replace("GMT","");
   date4=date4.replace(",","");
   let arrdate=date4.split(" ");
   let datetosql= arrdate[0]+" "+arrdate[1]+" "+arrdate[2]+" "+arrdate[3]+" "+person.hourRandom;
 
    let indexOfDelete= self.personsRH.findIndex(whatIsId);
    arrindexOfDelete.push(indexOfDelete);
      function whatIsId(person1) {
        if(person1.hourRandom === person.hourRandom)
        return person1 ;
      }
      let day1;
      let arrDay = ["א", "ב", "ג", "ד", "ה", "ו", "ז"];
      for (let j = 0; j < arrDay.length; j++) {

        if (person.day == j)
          day1 = arrDay[j];
      }

      let groupPlusMsg = [person.groupeOfQ, msg];
      let q = `insert into id_` + person.phoneId + `(date,day,dialogue,message,dead_linew) values (` + `"` + datetosql + `"` + `,` + `"` + day1 + `"` + `,` + `"` + person.numOfDialogueGroup + `"` + `,` + `"` + person.sentence + `"`+ `,` + `"` + person.late + `"`  + `)`;
      console.log("q",q,date4);
      if(msg!=""){
      self.mysqlCon.query(q, function (err, result, fields) {
        if (err) console.log("err sendingTheMsg", err);
        // self.personsRH.slice(person.index);

      });}
   
      personLength++;
      if (personLength == self.sendingP.length) {
        let date2 = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
        date2 = new Date(date2);
       // console.log("arrindexOfDelete",arrindexOfDelete);
        arrindexOfDelete.map((indexDelete)=>{
                 self.personsRH.splice(indexDelete,1);

        })
        if (self.personsRH.length !== 0)
          self.schTheSending();
      }
    });
  }

//    פונקציה שנקראת כל יום בחצות בעצם כל פעם שמושכים מגוגל  ומתחילה את התהליך מחדש
  changesonDB() {

    if ((typeof this.schNextTime != "undefined") && (this.schNextTime !== null))
      this.schNextTime.cancel();
    this.persons = [];
    let date = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
    let timeS = "5" + ' ' + "17" + ' * * ' + "3";
    date = new Date(date);

    console.log("time is", timeS);
    console.log("time now is", date);

    let sch = schedule.scheduleJob(timeS, function () {
      let date1 = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
      date1 = new Date(date);
    })
    date = new Date(date);
    this.schedulerNextOne();
  }


}

// בעצם יש מערך ששומר את כל האנשים שצריכה להישלח אליהם הודעה 
// ולכל אחד מהם יש שעה רנדומלית כאשר מגיעה השעה הרנדומלית נשלחת אליהם הודעה והם נמחקים מהמערך
module.exports = HandleSendingMSG;