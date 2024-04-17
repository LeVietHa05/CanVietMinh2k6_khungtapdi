const option = {
    allowEIO3: true,
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ["websocket", "polling"],
        credentials: true,
    },
}

const io = require("socket.io")(option);
const DataModel = require("./models/canvietminh.js");

const socketapi = {
    io: io
}

io.on("connection", (socket) => {
    console.log("[INFO] new connection: [" + socket.id + "]");

    socket.on("message", (data) => {
        console.log(data);
    });
    let lastTimeUpdate = Date.now();

    socket.on("/esp/up-data", async (data) => {
        console.log(`[/esp/up-data] from ${data.clientID} via socket id: ${socket.id}`);
        try {
            //check if the last update is less than 10s
            if (Date.now() - lastTimeUpdate < 3000) {
                return;
            }
            else {
//                 const acc = await DataModel.findOne({ clientID: data.clientID });
//                 if (!acc) {
//                     console.log("No account found");
//                     return;
//                 }
//                 let now = new Date();
//                 let time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
//                 let date = now.getDate() + "/" + now.getMonth() + "/" + now.getFullYear();
// 
//                 acc.updateData(data.temp, data.spo2, data.heartRate, data.distance, `${time} ${date}`);
//                 acc.updateLatLng(data.lat, data.long);
//                 await acc.save();
                lastTimeUpdate = Date.now();
                console.log("Update data success");
                socket.broadcast.emit("/web/up-data", { msg: "success" });
                if (+data.temp > 39) {
                    socket.broadcast.emit("/web/up-data", { msg: "alert" });
                }
            }
        } catch (e) {
            console.log("Error when finding account");
            console.log(e)
            return;
        }
    })

    /**************************** */
    //xu ly chung
    socket.on("reconnect", function () {
        console.log("[" + socket.id + "] reconnect.");
    });
    socket.on("disconnect", () => {
        console.log("[" + socket.id + "] disconnect.");
    });
    socket.on("connect_error", (err) => {
        console.log(err.stack);
    });
})

module.exports = socketapi;