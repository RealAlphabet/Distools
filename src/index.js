import { React, ReactDOM } from './lib/utilities';
import Distools from './lib/distools';
import App from './gui/app';


/* Adapt the size of the Discord wrapper  */
var wrapper = document.getElementById('app-mount');
wrapper.style.height = 'calc(100vh - 48px)';

/* Find an existant Distools wrapper or create a new one */
var node = document.getElementById('distools');
if (node) node.remove();

node = document.createElement('div');
node.id = 'distools';


/* Render from React and prepend the GUI */
ReactDOM.render(<App />, node);
document.body.prepend(node);

/* Allow a global use of the utility */
window.DISTOOLS = Distools;