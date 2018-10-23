require('dotenv').config()

console.log("Scheduler launched - " + Date())
require("./crawler").crawl()
setTimeout(()=>{ require("./db").emailScammers() }, 5*1000)
setTimeout(()=>{ require("./email").checkInbox() }, 10*1000)
setTimeout(()=>{
    console.log("Shutting down - " + Date())
    return process.exit(0)
}, 15*1000);
