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

function hijackInflate(callback) {
    return new Promise(resolve => {
        const originalPush = Inflate.prototype.push;

        Inflate.prototype.push = function () {
            const originalOnEnd = this.onEnd;

            // Hook on end custom function of Discord.
            this.onEnd = function () {
                callback(this.chunks);
                return originalOnEnd.apply(this, arguments);
            };

            // Restore original function.
            Inflate.prototype.push = originalPush;

            // Return a way to restore original function.
            resolve(() => {
                this.onEnd = originalOnEnd;
            });

            return originalPush.apply(this, arguments);
        };
    });
}


////////////////////////////////////////////
//  HIJACKER
////////////////////////////////////////////


export function hijack() {
    const Hijacker = { onPacket: () => 0 };
    const Packer = newPacker();

    // Try to hook WebSocket and the compression context.
    const promise = Promise.all([
        hijackWebSocket(),
        hijackInflate(chunks => {
            chunks.map(chunk => {
                Hijacker.onPacket(Packer.unpack(chunk));
            });
        })
    ]);

    return promise.then(([ws, stop]) => {
        console.log("HIJACKED.");

        // Set object properties.
        Object.assign(Packer, newPacker());
        Packer.ws = ws;
        Packer.stop = stop;

        return Packer;
    });
}
