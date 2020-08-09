import {
    sleep,
    DiscordAPI,
    DiscordConstants,
    DiscordUser,
    DiscordToken,
    DiscordMembers,
    DiscordChannels,
    DiscordMessages,
    SelectedGuildId,
    SelectedChannelId,
    DiscordReceiveMessages
} from './utilities';


/* DISTOOLS */
export default {
    async searchSharedFriends(userId) {
        var members = this.members;
        var result = [];

        for (var member of members) {
            if (!member.relationships) {
                var relationships = await DiscordAPI.get(DiscordConstants.Endpoints.USER_RELATIONSHIPS(member.userId));
                member.relationships = JSON.parse(relationships.text);
            }

            if (member.relationships.length) {
                result.push(member);
            }
        }

        if (userId) {
            var _arr = [];

            for (var member of result) {
                if (member.relationships.find(relationship => relationship.id === userId)) {
                    _arr.push(member);
                }
            }

            result = _arr;
        }

        return result;
    },

    searchOwnGuildMessages(guildId, authorId = this.user.id, offset = 0) {
        return new Promise((resolve, reject) => {
            DiscordAPI.get(`${DiscordConstants.Endpoints.SEARCH_GUILD(guildId)}?author_id=${authorId}&include_nsfw=true&offset=${offset}`)
                .then(data => resolve(data.body))
                .catch(reject);
        });
    },

    searchOwnChannelMessages(channelId, authorId = this.user.id, offset = 0) {
        return new Promise((resolve, reject) => {
            DiscordAPI.get(`${DiscordConstants.Endpoints.SEARCH_CHANNEL(channelId)}?author_id=${authorId}&offset=${offset}`)
                .then(data => resolve(data.body))
                .catch(reject);
        });
    },

    async deleteOwnGuildMessages() {
        var guildId = this.selectedGuildId;
        var result = await this.searchOwnGuildMessages(guildId);
        var count = 0;

        if (result) {
            if (result.total_results > 0) {
                this.progressBar.setSteps(result.total_results);

                do {
                    console.log(`${result.total_results} remaining messages.`);
                    await sleep(200);

                    for (var chunk of result.messages) {
                        for (var message of chunk) {
                            if (message.hit && !message.call) {
                                await this.deleteMessage(message.channel_id, message.id);
                                await sleep(200);
                                count++;
                            }
                        }

                        this.progressBar.setProgress(count);
                    }

                } while ((result = await this.searchOwnGuildMessages(guildId)) && (result.total_results > 0));
                console.log('Done.');

                await sleep(2000);
                this.progressBar.setProgress(0);

            } else console.log('No message to delete.');
        } else console.log('Index is not ready, try again.');
    },

    async deleteOwnChannelMessages() {
        var channelId = this.selectedChannelId;
        var result = await this.searchOwnChannelMessages(channelId);
        var count = 0;

        if (result) {
            if (result.total_results > 0) {
                this.progressBar.setSteps(result.total_results);

                do {
                    console.log(`${result.total_results} remaining messages.`);
                    await sleep(200);

                    for (var chunk of result.messages) {
                        for (var message of chunk) {
                            if (message.hit && !message.call) {
                                await this.deleteMessage(channelId, message.id);
                                await sleep(200);
                                count++;
                            }
                        }

                        this.progressBar.setProgress(count);
                    }

                } while ((result = await this.searchOwnChannelMessages(channelId)) && (result.messages.length > 0));
                console.log('Done.');

                await sleep(2000);
                this.progressBar.setProgress(0);

            } else console.log('No message to delete.');
        } else console.log('Index is not ready, try again.');
    },

    async fetchAllMessages(channelId = this.selectedChannelId) {
        var messages = this.messages.reverse();
        var result = [];

        do {
            result.push(...messages);

            messages = (await DiscordAPI.get({
                url: DiscordConstants.Endpoints.MESSAGES(channelId),
                query: {
                    before: messages[messages.length - 1].id,
                    limit: 100
                }

            })).body;
        }
        while (messages.length > 0);
        return result.reverse();
    },

    async saveMessages() {
        alert('Starting downloading conversation.\nPlease do not click any buttons of the menu !');

        var members = this.members;
        var member;

        var messages = await this.fetchAllMessages();
        var message;

        var membersList = [];
        var messagesList = [];

        for (message of messages) {
            messagesList.push({
                id: message.id,
                author: message.author.id,
                content: message.content,
                timestamp: message.timestamp
            })
        }

        members.push(this.user);

        for (member of members) {
            membersList.push({
                id: member.id,
                username: member.username,
                discriminator: member.discriminator,
                avatar: member.avatar
            });
        }

        this.downloadTextFile(`${messages[0].channel_id}.json`, JSON.stringify({
            members: membersList,
            messages: messagesList
        }, null, 2));
    },

    async anarchy() {
        var messages = this.messages.reverse();
        var message;

        var reactions = ['🇨', '🇴', '🇺', '🇷', '🇦', '🇬', '🇪'];
        var reaction;

        for (message of messages) {
            for (reaction of reactions) {
                await this.addReaction(message, reaction);
                await sleep(95);
            }
        }
    },

    addReaction(message, reaction = "🍆") {
        return new Promise((resolve, reject) => {
            DiscordAPI.put(DiscordConstants.Endpoints.REACTION(message.channel_id, message.id, reaction, "@me"))
                .then(resolve)
                .catch(reject);
        });
    },

    downloadTextFile(fileName, fileContents) {
        var url = window.URL.createObjectURL(new Blob([fileContents], { "type": "octet/stream" }));
        var a = document.createElement("a");

        a.href = url;
        a.download = fileName;
        a.style.display = "none";

        document.body.prepend(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    deleteMessage(channelId, messageId) {
        return new Promise((resolve, reject) => {
            DiscordAPI.delete(`${DiscordConstants.Endpoints.MESSAGES(channelId)}/${messageId}`)
                .then(data => resolve(data.body))
                .catch(reject);
        });
    },

    get receiveMessages() {
        return DiscordReceiveMessages;
    },

    get members() {
        if (this.selectedGuildId) return DiscordMembers.getMembers(this.selectedGuildId);
        else return this.selectedChannel._getUsers();
    },

    get selectedGuildId() {
        return SelectedGuildId.getGuildId();
    },

    get selectedChannelId() {
        return SelectedChannelId.getChannelId();
    },

    get selectedChannel() {
        return DiscordChannels.getChannel(this.selectedChannelId);
    },

    get messages() {
        return DiscordMessages.getMessages(this.selectedChannelId).toArray();
    },

    get user() {
        return DiscordUser.getCurrentUser();
    },

    get token() {
        return DiscordToken.getToken();
    },

    _test() {
        var style = document.createElement('style');
        style.innerHTML = ".video-8eMOth, .imageWrapper-2p5ogY > img { transition: filter ease-in-out .25s; filter: blur(0.6rem); }\n.video-8eMOth:hover, .imageWrapper-2p5ogY > img:hover { filter: unset; }";
        document.head.append(style);
    }
};