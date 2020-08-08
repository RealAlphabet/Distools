import { React } from '../lib/utilities';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.progressBar = React.createRef();
        this.steps = 100;
    }

    setSteps(steps) {
        this.steps = steps;
    }

    setProgress(progress) {
        this.progressBar.current.style.width = `${(progress / this.steps) * 100}%`;
    }

    render() {
        return (
            <div class="progress-bar">
                <div class="progress" ref={this.progressBar}></div>
            </div>
        )
    }
}