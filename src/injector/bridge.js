import { contextBridge } from 'electron';
import WebSocket from 'ws';
import path from 'path';


/////////////////////////////////////////
//  BRIDGE
/////////////////////////////////////////


export default function () {

    const SERVERS = [];


    ///////////////////////
    //  WEBSOCKETS
    ///////////////////////


    contextBridge.exposeInMainWorld('WebsocketServer', {
        listen(options, callback) {
            const ws = new WebSocket.Server(options);
            const connections = [];

            // Keep track of servers to properly close

            SERVERS.push(ws);

            // Listening new connections

            ws.on('connection', function (ws, req) {
                callback({
                    on: ws.on,
                    off: ws.off,
                    once: ws.once,

                    send(packet) {
                        packet = JSON.stringify(packet);
                        ws.send(packet);
                    },

                    readyState() {
                        return ws.readyState;
                    }

                }, req.headers.origin);
            });

            // Return isolated functions

            return {
                broadcast(packet) {
                    packet = JSON.stringify(packet);
                    connections.forEach(ws => ws.send(packet));
                },

                close: ws.close
            }
        }
    });


    /////////////////////////////////////////
    //  MAIN
    /////////////////////////////////////////


    // Properly close Websocket Servers

    window.addEventListener('beforeload', function () {
        SERVERS.forEach(ws => ws.close())
    });

    // Load Discord preload

    require(path.join(__dirname, 'core.asar/app/mainScreenPreload'));
}
