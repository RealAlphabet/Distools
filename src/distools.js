import WebpackModules, { sleep } from './utilities';

function triger(e) {
    var fnName = e.target.getAttribute('data-target');
    DISTOOLS[fnName]();
}

global.DISTOOLS = {
    wait: 150,

    inject: function () {
        var node = document.createElement("div");
        node.id = 'distools';

        var app = document.getElementById('app-mount');
        app.style.height = 'calc(100vh - 3rem)';

        node.innerHTML = `        
            <div class="title">
                DISTOOLS
            </div>
    
            <button data-target="deleteAllMessages">
                🗑️ Delete messages
            </button>
    
            <button data-target="saveAllMessages">
                💾 Save messages
            </button>
    
            <button class="right" data-target="uninject">
                ✖ Exit
            </button>
    
            <style>
                #distools {
                    box-sizing: border-box;
                    background-color: #191818;
                    color: #fff;
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    display: flex;
                    width: 100%;
                    height: 3rem;
                    padding-left: 4.5rem;
                    padding-right: 4.5rem;
                    font-size: 0.85rem;
                }
    
                .title {
                    margin-right: 1.5rem;
                    font-weight: bold;
                }
    
                #distools > *:not(style) {
                    display: flex;
                    align-items: center;
                    height: 100%;
                }
    
                #distools > button {
                    transition: background-color ease-in-out .2s;
                    background-color: #191818;
                    color: #fff;
                    padding-left: 1rem;
                    padding-right: 1rem;
                }
    
                #distools > button:hover {
                    background-color: #000;
                }
    
                .right {
                    margin-left: auto;
                }
            </style>
        `;

        for (var elem of node.children) {
            if (elem.nodeName === 'BUTTON') {
                elem.addEventListener('click', triger);
            }
        }

        document.body.prepend(node);
    },

    uninject: function () {
        var node = document.getElementById('distools');
        var app = document.getElementById('app-mount');

        if (node) node.remove();
        app.style.height = null;
    },

    deleteMessage: function (message) {
        return new Promise((resolve, reject) => {
            var init = {
                method: 'DELETE',
                headers: { 'Authorization': this.token }
            }

            fetch(`https://discordapp.com/api/v6/channels/${message.channel_id}/messages/${message.id}`, init)
                .then(resolve)
                .catch(reject);
        });
    },

    searchGuildMessages: function (guildId) {
        return new Promise((resolve, reject) => {
            var init = {
                method: 'GET',
                headers: { 'Authorization': this.token }
            }

            fetch(`https://discordapp.com/api/v6/guilds/${guildId}/messages/search?author_id=${this.userId}`, init)
                .then(data => data.json())
                .then(resolve)
                .catch(reject);
        });
    },

    deleteAllMessages: async function () {
        var guildId = this.selectedGuildId;
        var count = 0;
        var result;

        while ((result = await this.searchGuildMessages(guildId)) && result.messages.length > 0) {
            console.log(`${result.total_results} remaining messages.`);
            await sleep(this.wait);

            for (var chunk of result.messages) {
                for (var message of chunk) {
                    if (message.hit) {
                        await this.deleteMessage(message);
                        await sleep(this.wait);
                        count++;
                    }
                }
            }
        }

        if (count) alert(`${count} messages have been deleted.`);
        else alert(`There is no messages.`);
    },

    addReaction(message, reaction) {
        return new Promise(resolve => {
            this.discordAPI.put(this.discordConstants.Endpoints.REACTION(this.selectedChannelId, message.id, reaction, '@me')).then(resolve);
        });
    },

    removeReaction(message, reaction) {
        return new Promise(resolve => {
            this.discordAPI.delete(this.discordConstants.Endpoints.REACTION(this.selectedChannelId, message.id, reaction, '@me')).then(resolve);
        });
    },

    get discordAPI() {
        return WebpackModules.getByProps("getAPIBaseURL");
    },

    get discordConstants() {
        return WebpackModules.getByProps("Permissions", "ActivityTypes", "StatusTypes");
    },

    get selectedGuildId() {
        return WebpackModules.getByProps("getLastSelectedGuildId").getGuildId();
    },

    get selectedChannelId() {
        return WebpackModules.getByProps("getLastSelectedChannelId").getChannelId();
    },

    get selectedChannel() {
        let store = WebpackModules.getByProps("getChannels");
        return store.getChannel(this.selectedChannelId);
    },

    get messages() {
        return WebpackModules.getByProps("getMessages").getMessages(this.selectedChannelId);
    },

    get userId() {
        return (this._userId)
            ? this._userId
            : this._userId = WebpackModules.getByProps("getCurrentUser").getCurrentUser().id;
    },

    get token() {
        return (this._token)
            ? this._token
            : this._token = WebpackModules.getByProps("getToken").getToken();
    }
};

DISTOOLS.uninject();
DISTOOLS.inject();
