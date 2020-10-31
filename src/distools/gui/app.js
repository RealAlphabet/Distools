import { React } from '../lib/utilities';
import Distools from '../lib/distools';

import Settings from './settings';
import ProgressBar from './progress';
import style from './app.css';

export default class extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hideSettings: true
        }

        this.progressBar = React.createRef();
    }

    componentDidMount() {
        Distools.progressBar = this.progressBar.current;
    }

    render() {
        return (
            <React.Fragment>
                <style>{style}</style>
                <Settings hide={this.state.hideSettings} />

                <nav>
                    <ProgressBar ref={this.progressBar} />

                    <div class="title">
                        DISTOOLS
                    </div>

                    <ul>
                        <li onClick={() => Distools.deleteGuildMessages()}>🗑️ Delete guild messages</li>
                        <li onClick={() => Distools.deleteChannelMessages()}>🗑️ Delete channel messages</li>
                        <li onClick={() => Distools.saveMessages()}>💾 Save messages</li>
                    </ul>

                    <ul class="right">
                        <li onClick={() => this.setState({ hideSettings: !this.state.hideSettings })}>⚙️ Settings</li>
                    </ul>
                </nav>
            </React.Fragment>
        )
    }
}