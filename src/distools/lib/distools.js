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
    UsersManager,
    DiscordReceiveMessages
} from './utilities';


export default {


    ///////////////////////////////////////////////////////////
    //  UNIQUE TOOLS
    ///////////////////////////////////////////////////////////


    async searchSharedFriends(who) {
        let users = Object.values(this.users);
        let result = [];

        // Load all relationships.
        for (let user of users) {
            if (user.relationships === undefined) {
                user.relationships = await DiscordAPI.get(DiscordConstants.Endpoints.USER_RELATIONSHIPS(user.id));
                user.relationships = JSON.parse(user.relationships.text);
            }

            if (user.relationships.length)
                result.push(user);
        }

        // Return friends of selected user.
        return result.filter(user => user.relationships.find(relationship => relationship.id === who));
    },


    ///////////////////////////////////////////////////////////
    //  SEARCH MESSAGES
    ///////////////////////////////////////////////////////////


    searchGuildMessages(where = this.selectedGuildId, user = this.user.id, offset = 0) {
        return DiscordAPI.get(DiscordConstants.Endpoints.SEARCH_GUILD(where) + `?author_id=${user}&include_nsfw=true&offset=${offset}`)
            .then(data => data.body);
    },

    searchChannelMessages(where = this.selectedChannelId, user = this.user.id, offset = 0) {
        return DiscordAPI.get(DiscordConstants.Endpoints.SEARCH_CHANNEL(where) + `?author_id=${user}&offset=${offset}`)
            .then(data => data.body);
    },

    async searchAllMessages(func, where, user, hit = true) {
        let messages = [];
        let offset = 0;
        let result;

        while ((result = await func(where, user, offset)).messages.length) {
            // Push all messages.
            messages.push(...result.messages);

            // Increment search offset.
            offset += result.messages.length;
        }

        // Sort messages if necessary.
        return hit
            ? messages.map(chunk => chunk.find(message => message.hit))
            : messages;
    },

    searchAllGuildMessages(where = this.selectedGuildId, user = this.user.id, hit = true) {
        return this.searchAllMessages(this.searchGuildMessages, where, user, hit);
    },

    searchAllChannelMessages(where = this.selectedChannelId, user = this.user.id, hit = true) {
        return this.searchAllMessages(this.searchChannelMessages, where, user, hit);
    },


    ///////////////////////////////////////////////////////////
    //  DELETE MESSAGES
    ///////////////////////////////////////////////////////////


    deleteMessage(channel, message) {
        return DiscordAPI.delete(DiscordConstants.Endpoints.MESSAGES(channel) + '/' + message)
            .then(data => data.body);
    },

    async deleteSearchMessages(func, where, user) {
        let messages = await this.searchAllMessages(func, where, user);
        let progress = 0;

        // Set progression steps.
        this.progressBar.setSteps(messages.length);

        // Delete all found messages.
        for (let message of messages) {

            // Set progression.
            this.progressBar.setProgress(++progress);

            // Show debug message.
            console.log(`[DISTOOLS][🗑️] ${progress} / ${messages.length} messages.`);

            // Delete message and wait.
            if (message.type == 0) {
                await this.deleteMessage(message.channel_id, message.id);
                await sleep(850);
            }
        }

        // Show debug message.
        console.log('Done.');

        // Wait a bit and reset progress bar.
        await sleep(2000);
        this.progressBar.setProgress(0);
    },

    deleteGuildMessages(where = this.selectedGuildId, user = this.user.id) {
        return this.deleteSearchMessages(this.searchGuildMessages, where, user);
    },

    deleteChannelMessages(where = this.selectedChannelId, user = this.user.id) {
        return this.deleteSearchMessages(this.searchChannelMessages, where, user);
    },


    ///////////////////////////////////////////////////////////
    //  SAVE MESSAGES
    //  @TODO
    ///////////////////////////////////////////////////////////


    async fetchAllMessages(channelId = this.selectedChannelId) {
        let messages = this.messages.reverse();
        let result = [];

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
        let url = window.URL.createObjectURL(new Blob([fileContents], { "type": "octet/stream" }));
        let a = document.createElement("a");

        a.href = url;
        a.download = fileName;
        a.style.display = "none";

        document.body.prepend(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    get receiveMessages() {
        return DiscordReceiveMessages;
    },

    get members() {
        return this.SelectedGuildId
            ? DiscordMembers.getMembers(this.selectedGuildId)
            : DiscordChannels.getChannel(this.selectedChannelId).rawRecipients;
    },

    get users() {
        return UsersManager.getUsers();
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