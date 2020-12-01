import {
    sleep,
    DiscordAPI,
    DiscordConstants,
    DiscordUser,
    DiscordMembers,
    DiscordChannel,
    DiscordMessages,
    SelectedGuildId,
    SelectedChannelId,
    UsersManager,
} from './utilities';


export default {

    ///////////////////////////////////////////////////////////
    //  UTILS
    ///////////////////////////////////////////////////////////


    fetchRetry(method, endpoint) {
        return new Promise((resolve, reject) => {
            method(endpoint)
                .then(res => resolve(res.body))
                .catch(res => {
                    res.statusCode == 429
                        ? setTimeout(() => resolve(this.fetchRetry(method, endpoint)), res.body.retry_after * 1000)
                        : reject(res);
                });
        });
    },


    ///////////////////////////////////////////////////////////
    //  UNIQUE TOOLS
    ///////////////////////////////////////////////////////////


    fetchRelationships(id) {
        return this.fetchRetry(DiscordAPI.get, DiscordConstants.Endpoints.USER_RELATIONSHIPS(id));
    },

    fetchAllMembers() {
        console.log(DiscordConstants.Endpoints);
    },

    async searchSharedFriends(who) {
        let users = Object.values(this.users);
        let promises = [];

        // Fetch all relationships.
        for (let user of users)
            if (user.relationships)
                promises.push(Promise.resolve(user));

            else {
                promises.push(this.fetchRelationships(user.id).then(relationships => {
                    return (user.relationships = relationships), user;
                }));

                await sleep(25);
            }

        // Find relationships of the user.
        return Promise.all(promises).then(users => {
            return users.filter(({ relationships }) => {
                return relationships.find(({ id })  => id === who);
            });
        });
    },


    ///////////////////////////////////////////////////////////
    //  SEARCH MESSAGES
    ///////////////////////////////////////////////////////////


    searchGuildMessages(where = this.selectedGuildId, user = this.user.id, offset = 0) {
        return this.fetchRetry(DiscordAPI.get, DiscordConstants.Endpoints.SEARCH_GUILD(where) + `?author_id=${user}&include_nsfw=true&offset=${offset}`);
    },

    searchChannelMessages(where = this.selectedChannelId, user = this.user.id, offset = 0) {
        return this.fetchRetry(DiscordAPI.get, DiscordConstants.Endpoints.SEARCH_CHANNEL(where) + `?author_id=${user}&offset=${offset}`);
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

            // @FIX : We can't search for more than 1500 messages per minute.
            if (messages.length >= 1500)
                break;
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
        return this.fetchRetry(DiscordAPI.delete, DiscordConstants.Endpoints.MESSAGES(channel) + '/' + message);
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
            if (message.type == 0 || message.type == 19) {
                await this.deleteMessage(message.channel_id, message.id);
                await sleep(150);
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

    saveMessages(channel = this.selectedChannelId) {
        alert('Starting downloading conversation.\nPlease do not click any buttons of the menu !');

        this.fetchAllMessages(channel).then(messages => {
            const users = new Map();

            messages = messages.map(message => {
                // Save message sender.
                users.set(message.author.id, message.author);

                /* @Fix : Clone the message
                 * Remove the message author from reference.
                 *
                 * @Fix : Because Discord hook fetch (to cache the received messages ?)
                 * we can't replace the author of the original reference without crashing our client.
                 */
                message = {...message};
                message.author = message.author.id;
                delete message.channel_id;
                return message;
            });

            this.downloadTextFile(`${messages[0].channel_id}.json`, JSON.stringify({
                channel,
                users: [...users.values()],
                messages
            }));
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

    get members() {
        return this.selectedGuildId
            ? DiscordMembers.getMembers(this.selectedGuildId)
            : DiscordChannel.getChannel(this.selectedChannelId).rawRecipients;
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
        return DiscordChannel.getChannel(this.selectedChannelId);
    },

    get messages() {
        return DiscordMessages.getMessages(this.selectedChannelId).toArray();
    },

    get user() {
        return DiscordUser.getCurrentUser();
    }
};