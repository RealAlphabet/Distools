// import { contextBridge } from 'electron';
import path from 'path';


/////////////////////////////////////////
//  BRIDGE
/////////////////////////////////////////


export default function () {

    // Load Discord preload

    require(path.join(__dirname, 'core.asar/app/mainScreenPreload'));
}
