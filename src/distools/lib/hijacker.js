import { Inflate } from '@/lib/utilities';


////////////////////////////////////////////
//  UTILS
////////////////////////////////////////////


function newPacker() {
    return {
        pack    : JSON.stringify,
        unpack  : data => data
    };
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
        let packer      = newPacker();
        let original    = context.onEnd;

        return {
            ws,


            ///////////////////////////
            //  TOOLS
            ///////////////////////////


            setSpotifyStatus(options = {}) {
                this.send({
                    op: 3,
                    d: {
                        status  : "dnd",
                        since   : 0,
                        activities: [
                            {
                                type    : 2,
                                name    : "Spotify",
                                assets: {
                                    large_image : `spotify:${options.image}`,
                                    large_text  : options.title
                                },
                                details : options.title,
                                state   : options.authors,
                                timestamps: {
                                    start       : Date.now(),
                                    end         : Date.now() + (1000 * 3600 * 24)
                                },
                                party: {
                                    id: "spotify:"
                                },
                                sync_id : null,
                                flags   : 48,
                                metadata: {
                                    album_id    : null,
                                    artist_ids  : []
                                }
                            }
                        ],
                        afk     : false
                    }
                });
            },

            setVoiceState(options = {}) {
                this.send({
                    op: 4,
                    d: {
                        guild_id    : options.guild     ?? DISTOOLS.selectedGuildId,
                        channel_id  : options.channel   ?? DISTOOLS.selectedChannelId,
                        self_mute   : mute              ?? false,
                        self_deaf   : deaf              ?? false,
                        self_video  : video             ?? false
                    }
                });
            },

            fetchGuildMembers() {
                for (let i = 0; i < 5000; i += 100) {
                    this.send({
                        op: 14,
                        d: {
                            guild_id: DISTOOLS.selectedGuildId,
                            channels: {
                                [DISTOOLS.selectedChannelId]: [
                                    [0, 99], [i, (i - 1)]
                                ]
                            }
                        }
                    });
                }
            },


            ///////////////////////////
            //  UTILS
            ///////////////////////////


            send(data) {
                ws.send(packer.pack(data));
            },

            receive(callback) {
                // Save original function.
                original = context.onEnd;

                // Hook the callback function.
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
