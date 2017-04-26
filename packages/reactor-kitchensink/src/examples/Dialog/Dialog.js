import React, { Component } from 'react';
import { Dialog, Container, Button } from '@extjs/ext-react';

export default class DialogExample extends Component {

    state = {
        showDialog: false
    }

    render() {
        const { showDialog } = this.state;

        return (
            <Container>
                <Button text="Show Dialog" handler={this.showDialog} ui="action raised"/>
                <Dialog 
                    displayed={showDialog}
                    title="Dialog"
                    closable
                    closeAction="hide"
                    maskTapHandler={this.onCancel}
                    bodyPadding="20"
                    maxWidth="200"
                    defaultFocus="#ok"
                    buttons={{
                        ok: this.onOk,
                        cancel: this.onCancel
                    }}
                >
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore 
                    magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea 
                    commodo consequat.'
                </Dialog>
            </Container>
        )
    }

    showDialog = () => {
        this.setState({ showDialog: true });
    }

    onOk = () => {
        this.setState({ showDialog: false });
    }

    onCancel = () => {
        this.setState({ showDialog: false });
    }

}