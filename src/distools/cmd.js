import Distools from './lib/distools';


///////////////////////////////////////////////////////////
//  MAIN
///////////////////////////////////////////////////////////


// Add a fake progressBar object.
Distools.progressBar = new Proxy({}, {
    get() {
        return () => {};
    }
});

// Allow a global use of the utility.
window.DISTOOLS = Distools;
