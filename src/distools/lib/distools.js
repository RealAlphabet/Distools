import {
    sleep,
    DiscordAPI,
    DiscordConstants,
    DiscordUser,
    DiscordMembers,
    DiscordChannels,
    DiscordMessages,
    SelectedGuildId,
    SelectedChannelId,
    DiscordReceiveMessages
} from './utilities';

import * as a from './utilities';

console.log(a);

import style from '@/gui/custom.css';

const node = document.createElement('style');
node.innerText = style;
document.head.append(node);

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

    saveMessages() {
        alert('Starting downloading conversation.\nPlease do not click any buttons of the menu !');

        this.fetchAllMessages().then(messages => {
            const members = this.members.map(member => ({
                id: member.id,
                username: member.username,
                discriminator: member.discriminator,
                avatar: member.avatar
            }));

            members.push(this.user);

            this.downloadTextFile(`${messages[0].channel_id}.json`, JSON.stringify({
                members,
                messages: messages.map(message => ({
                    id: message.id,
                    author: message.author.id,
                    content: message.content,
                    timestamp: message.timestamp
                }))
            }, null, 2));
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
        return DiscordAPI.delete(`${DiscordConstants.Endpoints.MESSAGES(channelId)}/${messageId}`)
            .then(data => data.body);
    },

    get receiveMessages() {
        return DiscordReceiveMessages;
    },

    get members() {
        return this.SelectedGuildId
            ? DiscordMembers.getMembers(this.selectedGuildId)
            : DiscordChannels.getChannel(this.selectedChannelId).rawRecipients;
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
    }
};