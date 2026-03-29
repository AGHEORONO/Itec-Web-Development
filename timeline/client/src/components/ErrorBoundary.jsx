import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ background: '#220000', color: 'red', padding: 20, zIndex: 999999, position: 'absolute', inset: 0, overflow: 'auto', fontFamily: 'monospace' }}>
                    <h2>CRASH in {this.props.name}</h2>
                    <pre>{this.state.error.toString()}</pre>
                    <pre>{this.state.error.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}
