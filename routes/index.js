var express = require('express');
var router = express.Router();
const { body, validationResult, query } = require("express-validator");

const DataModel = require("../models/canvietminh.js");

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
      req.session.user = user.username;
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
      return res.status(400).json({msg: msg});
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
        pulse: [],
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
module.exports = router;
