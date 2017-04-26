import React, { Component } from 'react';
import { TabPanel, Panel, Toolbar, Button } from '@extjs/ext-react'; 

Ext.require('Ext.Toast');

export default class Closable extends Component {

    state = {
        tabs: [1,2,3].map(i => this.createTab(i)),
        activeTab: 0
    }

    addTab = () => {
        const index = this.state.tabs.length;
        
        return this.setState({ 
            activeTab: index,
            tabs: [
                ...this.state.tabs, 
                this.createTab(index+1)
            ]
        });
    } 

    onCloseTab = (tab) => {
        Ext.toast(`${tab.getTitle()} closed.`)
    }

    render() {
        const { tabs, activeTab } = this.state;

        return (
            <TabPanel 
                activeItem={activeTab} 
                tabBar={{
                    layout: {
                        pack: 'left'
                    }
                }}
                shadow 
            >
                { this.state.tabs }
                <Toolbar docked="top">
                    <Button iconCls="x-fa fa-plus" text="Add Tab" handler={this.addTab}/>
                </Toolbar>
            </TabPanel>
        )
    }

    createTab(i) {
        return (
            <Panel 
                title={`Tab ${i}`} 
                tab={{ flex: 1, maxWidth: 150 }}
                key={i} 
                cls="card"
                layout="center"
                closable
                onDestroy={this.onCloseTab}
            >
                <div style={{ whiteSpace: 'nowrap' }}>Tab {i} Content</div>
            </Panel>
        )
    }
}