const { contextBridge } = require('electron');
const Bridge = require('./bridge');
const Loader = require('./loader');


/////////////////////////////////////////
//  LOAD SCRIPT
/////////////////////////////////////////


contextBridge
    ? Bridge()
    : module.exports = Loader();
