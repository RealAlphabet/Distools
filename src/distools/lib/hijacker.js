import { Inflate, ErlpackClass } from '@/lib/utilities';


////////////////////////////////////////////
//  UTILS
////////////////////////////////////////////


function newPacker() {
    if (ErlpackClass) {
        return new ErlpackClass;

    } else {
        return {
            pack: JSON.stringify,
            unpack: data => data
        };
    }
}

// @TODO : Simplify with a new "hook" function.
function hijackWebSocket() {
    return new Promise(resolve => {
        const original = WebSocket.prototype.send;

        WebSocket.prototype.send = function () {
            if (this.url.includes("gateway.discord.gg")) {
                // Restore original function.
                WebSocket.prototype.send = original;

                // Resolve WebSocket object.
                resolve(this);
            }

            // Execute original function.
            return original.apply(this, arguments);
        };
    });
}

// @TODO : Simplify with a new "hook" function.
function hijackInflate() {
    return new Promise(resolve => {
        const original = Inflate.prototype.push;

        Inflate.prototype.push = function () {

            // Restore original function.
            Inflate.prototype.push = original;

            // Resolve Inflate context.
            resolve(this);

            return original.apply(this, arguments);
        };
    });
}


////////////////////////////////////////////
//  HIJACKER
////////////////////////////////////////////


export function hijack() {
    const promise = Promise.all([
        hijackWebSocket(),
        hijackInflate()
    ]);

    // When hijacked return the connection.
    return promise.then(([ws, context]) => {
        let packer = newPacker();
        let original = context.onEnd;

        return {
            ws,

            send(data) {
                ws.send(packer.pack(data));
            },

            receive(callback) {
                // Save original context.
                original = context.onEnd;

                context.onEnd = function () {
                    this.chunks.map(chunk => {
                        callback(packer.unpack(chunk));
                    });

                    return original.apply(this, arguments);
                };
            },

            stop() {
                context.onEnd = original;
            }
        };
    });
}
