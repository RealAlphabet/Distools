import { hijack } from '@/lib/hijacker';

import {
    sleep,
    fetchRetry,
    downloadTextFile,
    DiscordAPI,
    DiscordConstants,
    DiscordUser,
    DiscordMembers,
    DiscordChannel,
    DiscordMessages,
    SelectedGuildId,
    SelectedChannelId,
    UsersManager,
    PresencesManager
} from '@/lib/utilities';


export const Distools = {


    hijack() {
        hijack().then(trampoline => {
            window.Trampoline = trampoline;
            console.log(`HIJACKED.`);
        });
    },


    ///////////////////////////////////////////////////////////
    //  UNIQUE TOOLS
    ///////////////////////////////////////////////////////////


    fetchRelationships(id) {
        return fetchRetry(DiscordAPI.get, DiscordConstants.Endpoints.USER_RELATIONSHIPS(id));
    },

    async searchSharedFriends(who) {
        let users = Object.values(Distools.users);
        let promises = [];

        // Fetch all relationships.
        for (let user of users)
            if (user.relationships)
                promises.push(Promise.resolve(user));

            else {
                promises.push(Distools.fetchRelationships(user.id).then(relationships => {
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

    getUserActivities(id) {
        let status = PresencesManager.clientStatuses[id];

        return status && {
            id,
            activities: PresencesManager.activities[id],
            status
        };
    },


    ///////////////////////////////////////////////////////////
    //  SEARCH MESSAGES
    ///////////////////////////////////////////////////////////


    searchGuildMessages(where = Distools.selectedGuildId, user = Distools.user.id, offset = 0) {
        return fetchRetry(DiscordAPI.get, DiscordConstants.Endpoints.SEARCH_GUILD(where) + `?author_id=${user}&include_nsfw=true&offset=${offset}`);
    },

    searchChannelMessages(where = Distools.selectedChannelId, user = Distools.user.id, offset = 0) {
        return fetchRetry(DiscordAPI.get, DiscordConstants.Endpoints.SEARCH_CHANNEL(where) + `?author_id=${user}&offset=${offset}`);
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

    searchAllGuildMessages(where = Distools.selectedGuildId, user = Distools.user.id, hit = true) {
        return Distools.searchAllMessages(Distools.searchGuildMessages, where, user, hit);
    },

    searchAllChannelMessages(where = Distools.selectedChannelId, user = Distools.user.id, hit = true) {
        return Distools.searchAllMessages(Distools.searchChannelMessages, where, user, hit);
    },


    ///////////////////////////////////////////////////////////
    //  DELETE MESSAGES
    ///////////////////////////////////////////////////////////


    deleteMessage(channel, message) {
        return fetchRetry(DiscordAPI.delete, DiscordConstants.Endpoints.MESSAGES(channel) + '/' + message);
    },

    async deleteSearchMessages(func, where, user) {
        let messages = await Distools.searchAllMessages(func, where, user);
        let progress = 0;

        // Set progression steps.
        Distools.progressBar.setSteps(messages.length);

        // Delete all found messages.
        for (let message of messages) {

            // Set progression.
            Distools.progressBar.setProgress(++progress);

            // Show debug message.
            console.log(`[DISTOOLS][🗑️] ${progress} / ${messages.length} messages.`);

            // Delete message and wait.
            if (message.type == 0 || message.type == 19) {
                await Distools.deleteMessage(message.channel_id, message.id);
                await sleep(150);
            }
        }

        // Show debug message.
        console.log('Done.');

        // Wait a bit and reset progress bar.
        await sleep(2000);
        Distools.progressBar.setProgress(0);
    },

    deleteGuildMessages(where = Distools.selectedGuildId, user = Distools.user.id) {
        return Distools.deleteSearchMessages(Distools.searchGuildMessages, where, user);
    },

    deleteChannelMessages(where = Distools.selectedChannelId, user = Distools.user.id) {
        return Distools.deleteSearchMessages(Distools.searchChannelMessages, where, user);
    },


    ///////////////////////////////////////////////////////////
    //  SAVE MESSAGES
    ///////////////////////////////////////////////////////////


    async fetchAllMessages(channelId = Distools.selectedChannelId) {
        let messages = [];
        let result = [];

        do {
            result.push(...messages);

            messages = (await DiscordAPI.get({
                url: DiscordConstants.Endpoints.MESSAGES(channelId),
                query: {
                    before: messages.length
                        ? messages[messages.length - 1].id
                        : null,
                    limit: 100
                }
            })).body;
        }
        while (messages.length > 0);
        return result.reverse();
    },

    saveMessages(channel = Distools.selectedChannelId) {
        alert('Starting downloading conversation.\nPlease do not click any buttons of the menu !');

        Distools.fetchAllMessages(channel).then(messages => {
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

            downloadTextFile(`${channel}.json`, JSON.stringify({
                channel,
                users: [...users.values()],
                messages
            }));
        });
    },


    ///////////////////////////////////////////////////////////
    //  GETTERS
    ///////////////////////////////////////////////////////////


    get members() {
        return Distools.selectedGuildId
            ? DiscordMembers.getMembers(Distools.selectedGuildId)
            : DiscordChannel.getChannel(Distools.selectedChannelId).rawRecipients;
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
        return DiscordChannel.getChannel(Distools.selectedChannelId);
    },

    get messages() {
        return DiscordMessages.getMessages(Distools.selectedChannelId).toArray();
    },

    get user() {
        return DiscordUser.getCurrentUser();
    }
};

export default Distools;
