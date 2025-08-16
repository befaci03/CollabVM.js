# CollabVM.js
# A TypeScript npm module that can interact with a CollabVM server!
----
## 1. How to use it
### a. Install the package
To install CollabVM.js to your workspace, do `npm install collabvm.js`
To update CollabVM.js, do `npm install collabvm.js@latest`
To install a specific version of CollabVM.js, do `npm install collabvm.js@the-version`
### b. Read the documentation
### c. Do your first bot
```js
const { Client, Guacamole } = require('collabvm.js');

(async () => {
    var cvm = await new Client("wss://example.com/collab-vm/vm0", "vm0", "username", { Origin: "computernewb.com" });
    await cvm.connect("nodeid if not specified in the Client");

    cvm.on(data => {
        console.log(Guacamole.decode(data));
    });

    await cvm.sendMessage('hay bois from collabvm.js');
    await cvm.sendXssMessage('<button class="btn btn-primary" onclick="collabvm.getVM().socket.close()">click me to bypass turn!</button>');

    await cvm.qemuCommand('sendkey ctrl-alt-delete'); // send control alt delete via the qemu monitor (admin only)
    await cvm.vote(false, true); // vote no by forcing (force is admin-only)

    await cvm.turn(true);
    await cvm.clickMouse(5, 64, "left");
    await cvm.moveMouse(743, 375);

    // you can disconnect your bot and reconnect it (why not)
    await cvm.disconnect();
    cvm._changeClassValue("websocket", "wss://computernewb.com/collab-vm/vm5");
    cvm._changeClassValue("node", "vm5");
    await cvm.reconnect();
    await cvm.connect("nodeid if not specified in the Client");
})();
```
