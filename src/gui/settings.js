import { React } from '../lib/utilities';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.node = React.createRef();
    }

    componentDidUpdate() {
        if (this.node.current) {
            window.requestAnimationFrame(() => {
                var style = this.node.current.style;
                style.transform = 'translate(-50%, -50%) scale(1)';
                style.opacity = '1';
            });
        }
    }

    render() {
        if (this.props.hide)
            return null;

        else return (
            <div class="modal" style={{ opacity: 0 }} ref={this.node}>
                <form class="settings">
                    <label>
                        <input type="radio" value="guild" checked="true" />
                        Current Guild
                    </label>

                    <label>
                        <input type="radio" value="channel" />
                        Current Channel
                    </label>
                </form>
            </div>
        )
    }
}