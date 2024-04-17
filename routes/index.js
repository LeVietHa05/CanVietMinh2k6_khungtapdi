var express = require('express');
var router = express.Router();
const { body, validationResult, query } = require("express-validator");

const DataModel = require("../models/canvietminh.js");
const { route } = require('../app.js');

require('dotenv').config()
/* GET home page. */
router.get('/', function (req, res, next) {
  if (!req.session.user) {
    console.log("User is not logged in")
    res.status(401).redirect("/login")
  } else {
    res.sendFile("index.html", { root: "./public/views" });
  }
});

//get login
router.get('/login', function (req, res, next) {
  res.sendFile("login.html", { root: "./public/views" });
});
router.post('/login',
  body('username', "username require and must be email").trim().escape().isEmail(),
  body('password', "password require").trim().escape().isLength({ min: 5 }),
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({ msg: "failed", err: errors.array() });
    }
    const { username, password } = req.body;
    //can use bycrypt to hash check password here
    //can use jwt to create token here
    //can cockies to store token here
    //but for now just normal login
    try {
      let user = await DataModel.findOne({ username, password });
      console.log(user)
      if (!user) {
        return res.status(400).json({ msg: "username or password incorrect" });
      }
      req.session.user = {
        username: user.username,
        role: user.role,
        clientID: user.clientID,
      }
      res.status(200).json({ msg: "login success" });
    } catch (e) {
      console.log(e);
      res.status(500).json({ msg: "login failed" });
    }
  });


//get register
router.post("/register",
  body('username', "username require and must be email").trim().escape().isEmail(),
  body('password', "password require and must longer than 5").trim().escape().isLength({ min: 5 }),
  body('repassword', "repassword require and must be same with password ").trim().escape().isLength({ min: 5 }),
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      let msg = errors.array().map((e) => e.msg).reduce((a, b) => a + "\n" + b);
      return res.status(400).json({ msg: msg });
    }
    const { username, password, repassword } = req.body;
    //can use bycrypt to hash password here
    //can use jwt to create token here
    //can cockies to store token here
    //but for now just normal register
    if (password !== repassword) {
      return res.status(400).send({ msg: "password and repassword not match" });
    }

    try {
      //check if user exist
      let user = await DataModel.findOne({ username });
      //if exist return error
      if (user) {
        return res.status(400).send({ msg: "user already exist" });
      }
      //else create user
      user = new DataModel({
        username: username,
        password: password,
        temp: [],
        spo2: [],
        heartRate: [],
        time: [],
        clientID: undefined,
        famillyID: [],
        role: "user",
      });
      await user.save();
      res.status(200).json({ msg: "Create user success" });
    } catch (e) {
      console.log(e);
      res.status(500).send({ msg: "Create user failed" });
    }
  });

//get session
router.get("/session", function (req, res, next) {
  if (req.session.user) {
    res.status(200).json({ msg: "session exist", user: req.session.user });
  } else {
    res.status(401).json({ msg: "session not exist" });
  }
});

//get logout
router.get("/logout", function (req, res, next) {
  req.session.destroy();
  res.status(200).json({ msg: "logout success" });
});

router.get("/api/data", async function (req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ msg: "user not login" });
  }
  try {
    let data = await DataModel.findOne({ clientID: req.session.user.clientID });
    if (!data) {
      return res.status(400).json({ msg: "data not found" });
    }
    let output = {}
    // console.log(data); 
    //number is the number of data you want to get from the end of the array
    let number = req.query.number || 10;
    // console.log(number);
    if (number > data.temp.length) {
      number = data.temp.length;
    }
    if (number <= 0) {
      number = 1;
    }
    output.temp = data.temp.slice(-number);
    output.spo2 = data.spo2.slice(-number);
    output.heartRate = data.heartRate.slice(-number);
    output.time = data.time.slice(-number);

    res.status(200).json(output);
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "get data failed" });
  }
});

const userMail = process.env.USER_MAIL;
const userPass = process.env.USER_PASS;
// console.log(userMail, userPass);

async function sendMail(to, subject, text) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: userMail,
      pass: userPass
    }
  });

  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  const mailOptions = {
    from: userMail,
    to: to,
    subject: subject,
    text: text
  };
  const info = await transporter.sendMail(mailOptions);
  console.log("Message sent: %s", info.messageId);
}

router.get("/api/sendmail", async function (req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ msg: "user not login" });
  }
  try {
    sendMail(req.session.user.username, "Cảnh báo nguy hiểm!", "Bệnh nhân có thể đang gặp những dấu hiệu nguy hiểm!")
    // sendMail('teaz.pseg@gmail.com', "Cảnh báo nguy hiểm!", "Bệnh nhân có thể đang gặp những dấu hiệu nguy hiểm!")
      .catch(console.error);
    res.json({ msg: "send mail success" });
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ msg: "send mail failed" });
  }
});


module.exports = router;
