// importing 
import express from "express"
import mongoose from "mongoose"
import Messages from "./dbMessages.js"
import Pusher from "pusher"
import cors from 'cors';


// app config 
const app = express()
const port = process.env.PORT || 9000


const pusher = new Pusher({
    appId: '1082640',
    key: 'ad1708ae9cc0183380d8',
    secret: '83313f492e603be6a724',
    cluster: 'eu',
    encrypted: true
  });
  
// middleware
app.use(express.json())
app.use(cors());
// app.use((req,res, next)=>{
//     res.setHeader("Access-Control-Allow-origin", "*")
//     res.setHeader("Access-Control-Allow-Headers", "*")
//     next()

// })

// app.use((req, res, next)=>{
//     res.setHeader()
// })

// Db config
// 'JXmODFFWUFAHN3zV'
const connection_url = "mongodb+srv://admin:JXmODFFWUFAHN3zV@cluster0.ovyvl.mongodb.net/whatsappdb?retryWrites=true&w=majority"

mongoose.connect(connection_url, {
    userCreateIndex: true,
    userNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once("open", () => {
    console.log("DB connected")

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change",(change)=>{
        console.log("A Change occured", change)
        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument; 
            pusher.trigger("message", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received : messageDetails.received,
            })
        } else {
            console.log("Error triggering Pusher")
        }
        
    })
})

// api routes 
app.get('/', (req, res)=> res.status(200).send('hello world'))

app.get('/messages/sync', (req,res)=>{
    Messages.find((err,data)=>{
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req,res)=>{

    const dbMessage = req.body

    Messages.create(dbMessage, (err , data)=>{
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: \n' ${data}`)
            console.log(data)
        }
    })
})

// listen
app.listen(port, ()=> console.log(`Listening on localhost:${port}`));


 