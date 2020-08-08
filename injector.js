const electron = require('electron');


/////////////////////////////////////////
//  ALLOW CORS
/////////////////////////////////////////


electron.session.defaultSession.webRequest.onHeadersReceived(function (details, callback) {
    delete details.responseHeaders["content-security-policy-report-only"];
    delete details.responseHeaders["content-security-policy"];
    callback({ cancel: false, responseHeaders: details.responseHeaders });
});


/////////////////////////////////////////
//  HOOK BROWSERWINDOW
/////////////////////////////////////////


class BrowserWindow extends electron.BrowserWindow {
    constructor(options) {
        super(options);

        if (options && options.webPreferences && options.webPreferences.preload && options.title)
            this.webContents.on("dom-ready", function () {
                this.executeJavaScript(`
                    (function() {
                        fetch('https://raw.githubusercontent.com/OnceDot/Distools/master/dist/script.min.js')
                            .then(res => res.text())
                            .then(res => {
                                const script = document.createElement("script");
                                script.type = "text/javascript";
                                script.text = res;
                                document.body.appendChild(script);
                            });
                    })();
                `);
            });
    }
}


/////////////////////////////////////////
//  RE DEFINE ELECTRON
/////////////////////////////////////////


Object.defineProperty(require.cache['electron'], 'exports', {
    value: Object.assign({}, electron, { BrowserWindow })
});


/////////////////////////////////////////
//  MAIN
/////////////////////////////////////////


module.exports = require('./core.asar');
