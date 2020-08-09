import electron from 'electron';
import path from 'path';


/////////////////////////////////////////
//  LOADER
/////////////////////////////////////////


export default function () {

    /////////////////////////////////////////
    //  ALLOW CORS
    /////////////////////////////////////////


    electron.session.defaultSession.webRequest.onHeadersReceived(function (details, callback) {
        delete details.responseHeaders["content-security-policy-report-only"];
        delete details.responseHeaders["content-security-policy"];
        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });


    /////////////////////////////////////////
    //  BROWSER WINDOW
    /////////////////////////////////////////


    class BrowserWindow extends electron.BrowserWindow {
        constructor(options) {
            options.webPreferences.preload = path.join(__dirname, 'index.js');
            super(options);

            this.webContents.on('dom-ready', function () {
                this.executeJavaScript(`
                        fetch('https://raw.githubusercontent.com/OnceDot/Distools/master/dist/script.js')
                            .then(res => res.text())
                            .then(eval);
                    `);
            });
        }
    }


    /////////////////////////////////////////
    //  PATCH ELECTRON
    /////////////////////////////////////////


    Object.defineProperty(require.cache['electron'], 'exports', {
        value: Object.assign({}, electron, { BrowserWindow })
    });


    /////////////////////////////////////////
    //  MAIN
    /////////////////////////////////////////


    return require('./core.asar');
}
