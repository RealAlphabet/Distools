
////////////////////////////////////////////
//  UTILS
////////////////////////////////////////////


export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


////////////////////////////////////////////
//  WEBPACK
////////////////////////////////////////////


export const WebpackModules = {

    getByProps(...props) {
        return this.getModule(module => {
            return props.every(property => module[property]);
        });
    },

    getByValue(prop, value) {
        return this.getModule(module => {
            return module[prop] == value;
        }, true);
    },

    getModule(filter, module = false) {
        let modules = this.getModules();

        for (let index in modules) {
            let { exports } = modules[index];

            if (exports) {
                if (exports.__esModule && exports.default && filter(exports.default))
                    return (module)
                        ? exports
                        : exports.default;

                if (filter(exports))
                    return exports;
            }
        }
    },

    getModules() {
        let id = "webpackmodules";

        if (this._require)
            return this._require;

        this._require = typeof (window.webpackJsonp) == "function"
            ? window.webpackJsonp([], {
                [id]: (_, exports, __webpack_require__) => exports.default = __webpack_require__
            }, [id]).default

            : window.webpackJsonp.push([[], {
                [id]: (module, _, __webpack_require__) => module.exports = __webpack_require__
            }, [[id]]]).c

        delete this._require[id];
        return this._require;
    }
}


////////////////////////////////////////////
//  MODULES
////////////////////////////////////////////


export const React = WebpackModules.getByProps("createElement", "cloneElement");
export const ReactDOM = WebpackModules.getByProps("render", "findDOMNode");

export const DiscordAPI = WebpackModules.getByProps("getAPIBaseURL");
export const DiscordConstants = WebpackModules.getByProps("Permissions", "ActivityTypes", "StatusTypes");
export const DiscordUser = WebpackModules.getByProps("getCurrentUser");
export const DiscordLogin = WebpackModules.getByProps("getToken");

export const DiscordMembers = WebpackModules.getByProps("getMember");
export const DiscordChannels = WebpackModules.getByProps("getChannels");
export const DiscordMessages = WebpackModules.getByProps("getMessages");
export const SelectedGuildId = WebpackModules.getByProps("getLastSelectedGuildId");
export const SelectedChannelId = WebpackModules.getByProps("getLastSelectedChannelId");
export const UsersManager = WebpackModules.getByProps("getUsers");

export const DiscordReceiveMessages = WebpackModules.getByProps("receiveMessage", "sendBotMessage");