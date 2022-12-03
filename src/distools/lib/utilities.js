import WebpackModules from '@/lib/webpack.js';


////////////////////////////////////////////
//  UTILS
////////////////////////////////////////////


export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function fetchRetry(method, endpoint) {
    return new Promise((resolve, reject) => {
        method(endpoint)
            .then(res => resolve(res.body))
            .catch(res => {
                res.status == 429
                    ? setTimeout(() => fetchRetry(method, endpoint).then(resolve), res.body.retry_after * 1000)
                    : reject(res);
            });
    });
}

export function downloadTextFile(fileName, fileContents) {
    let url = window.URL.createObjectURL(new Blob([fileContents], { "type": "octet/stream" }));
    let a = document.createElement("a");

    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    a.click();

    window.URL.revokeObjectURL(url);
}


////////////////////////////////////////////
//  MODULES
////////////////////////////////////////////


export const Inflate                = WebpackModules.getByProps("Inflate").Inflate;

export const React                  = WebpackModules.getByProps("createElement", "cloneElement");
export const ReactDOM               = WebpackModules.getByProps("render", "findDOMNode");

export const DiscordAPI             = WebpackModules.getByProps("getAPIBaseURL");
export const DiscordConstants       = WebpackModules.getByProps("Permissions", "ActivityTypes", "StatusTypes");
export const DiscordLogin           = WebpackModules.getByProps("getToken");
export const DiscordUser            = WebpackModules.getByProps("getCurrentUser");
export const DiscordReceiveMessages = WebpackModules.getByProps("receiveMessage", "sendBotMessage");

export const DiscordMembers         = WebpackModules.getByProps("getMember");
export const DiscordChannel         = WebpackModules.getByProps("getChannel");
export const DiscordChannels        = WebpackModules.getByProps("getChannels");
export const DiscordMessages        = WebpackModules.getByProps("getMessages");
export const SelectedGuildId        = WebpackModules.getByProps("getLastSelectedGuildId");
export const SelectedChannelId      = WebpackModules.getByProps("getLastSelectedChannelId");
export const UsersManager           = WebpackModules.getByProps("getUsers");
export const PresencesManager       = WebpackModules.getByProps("getActivityMetadata").getState();
