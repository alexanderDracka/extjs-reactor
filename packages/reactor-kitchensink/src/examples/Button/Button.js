import React, { Component } from 'react';
import { Container, Panel, Button, Menu, MenuItem } from '@extjs/ext-react';

export default function ButtonExample() {
    
    return (
        <Panel { ...layoutProps }>
            <Container>
                <div {...groupLabelProps}>Flat</div>
                <Container className="button-group" {...buttonGroupProps}>
                    <Button text="Normal"/>
                    <Button text="Decline" ui="decline"/>
                    <Button text="Confirm" ui="confirm"/>
                    <Button text="Disabled" disabled/>
                </Container>
            </Container>

            <Container>
                <div {...groupLabelProps}>Action</div>
                <Container className="button-group" { ...buttonGroupProps }>
                    <Button text="Normal" ui="action"/>
                    <Button text="Decline" ui="action decline"/>
                    <Button text="Confirm" ui="action confirm"/>
                    <Button text="Disabled" disabled ui="action"/>
                </Container>
            </Container>

            <Container>
                <div {...groupLabelProps}>Round</div>
                <Container className="button-group" { ...buttonGroupProps }>
                    <Button text="Normal" ui="round"/>
                    <Button text="Decline" ui="round decline"/>
                    <Button text="Confirm" ui="round confirm"/>
                    <Button text="Disabled" disabled ui="round"/>
                </Container>
            </Container>

            <Container>
                <div {...groupLabelProps}>Raised</div>
                <Container className="button-group" { ...buttonGroupProps }>
                    <Button text="Normal" ui="raised"/>
                    <Button text="Decline" ui="raised decline"/>
                    <Button text="Confirm" ui="raised confirm"/>
                    <Button text="Disabled" disabled ui="raised"/>
                </Container>
            </Container>

            <Container>
                <div {...groupLabelProps}>Badge</div>
                <Container className="button-group" { ...buttonGroupProps }>
                    <Button text="Normal" badgeText="2"/>
                    <Button text="Decline" ui="decline" badgeText="2"/>
                    <Button text="Confirm" ui="confirm" badgeText="2"/>
                    <Button text="Disabled" disabled badgeText="2"/>
                </Container>
            </Container>

            <Container>
                <div {...groupLabelProps}>Menu</div>
                <Container className="button-group" { ...buttonGroupProps }>
                    <Button text="Normal">{menu}</Button>
                    <Button text="Decline" ui="decline">{menu}</Button>
                    <Button text="Confirm" ui="confirm">{menu}</Button>
                    <Button text="Disabled" disabled>{menu}</Button>
                </Container>
            </Container>

            <Container>
                <div {...groupLabelProps}>Icon</div>
                <Container className="button-group" { ...buttonGroupProps }>
                    <Button iconCls="x-fa fa-home"/>
                    <Button ui="decline" iconCls="x-fa fa-home"/>
                    <Button text="Icon" ui="confirm" iconCls="x-fa fa-home"/>
                    <Button text="Icon" iconCls="x-fa fa-home" disabled>{menu}</Button>
                </Container>
            </Container>
        </Panel>
    )
}

const menu = (
    <Menu>
        <MenuItem text="Item 1"/>
        <MenuItem text="Item 2"/>
        <MenuItem text="Item 3"/>
    </Menu>
);

const layoutProps = Ext.os.is.Phone ? {
    height: '100%',
    width: '100%',
    scrollable: 'y',
    className: 'demo-buttons',
    defaults: {
        margin: '20'
    }
} : {
    // className: 'demo-buttons demo-buttons-desktop',
    padding: 10,
    shadow: true,
    defaults: {
        layout: 'hbox',
        flex: 1,
        margin: '10',
        width: '100%'
    }        
}

const buttonGroupProps = Ext.os.is.Phone ? {
    padding: '20 0 0 20',
    defaults: {
        margin: '0 20 20 0',
        width: 'calc(50% - 20px)',
    }
} : {
    padding: '17 0 17 20',
    layout: { type: 'hbox', align: 'middle', pack: 'space-around' },
    flex: 1,
    margin: '0 20 0 0',
    defaults: {
        margin: '0 20 0 0'
    }
}

const groupLabelProps = Ext.os.is.Phone ? {

} : {
    style: {
        width: '50px',
        textAlign: 'right',
        margin: '24px 20px 0 0'
    }
};

