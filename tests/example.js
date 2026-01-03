const { Client, Guacamole } = require('../dist/index');
var cvm = new Client("wss://creepervm.gunawan092w.eu.org/vms/vm2", "creepervm2", "BefaBot", "https://creepervm.gunawan092w.eu.org");

cvm.on('connect', () => {
    console.log('connected')
    // true means thats the bot token
    //(only enable if its an auth server)
    // and vice versa for false
    cvm.login('no', true);
    setTimeout(() => {
        cvm.sendMessage(cvm.connectedUsers);
    }, 1000);
});
cvm.on('error', console.error)
cvm.on('close', console.warn("Disconnected"))
cvm.connect();
