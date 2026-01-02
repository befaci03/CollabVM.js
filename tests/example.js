const { Client, Guacamole } = require('../dist/index');
var cvm = new Client("wss://computernewb.com/collab-vm/vm1", "vm1", "testbot", "computernewb.com");

cvm.on('connect', () => {
    console.log('connected')
    // true means thats the bot token
    //(only enable if its an auth server)
    // and vice versa for false
    cvm.login('TOKEN_HERE', true);
    cvm.sendMessage(`CollabVM.js v${require('../package.json').version} [TEST BOT]`);
    setTimeout(() => {
        cvm.banUser("fuckiefunkyassguest");
    }, 2000);
});
cvm.on('error', console.error)
cvm.on('close', console.warn("Disconnected"))
cvm.connect();
