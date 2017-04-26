import React, { Component } from 'react';
import { Container } from '@extjs/ext-react';
import { connect } from 'react-redux';
import { setTitle } from '../actions';

import days from '../util/days';

class Event extends Component {

    render() {
        const { data } = this.props;
        const day = data && data.date && data.date.match(/(Monday|Tuesday|Wednesday)/)[1];
        const speaker = data && data.speakers && data.speakers.length > 0 && data.speakers.map(s => s.name).join(', ');

        return (
            <Container masked={!data} padding="20" scrollable>
                { data && (
                    <div>
                        <div className="app-event-name">{data.title}</div>
                        <div className="app-event-speaker">{ data.speakerNames ? `by ${data.speakerNames}` : data.category }</div>
                        <div className="app-event-time">{day} {data.time}</div>
                        <div className="app-event-location">{data.location.name}</div>
                        <hr/>
                        <div className="app-event-abstract" dangerouslySetInnerHTML={{ __html: data.description }}/>
                    </div>
                )}
            </Container>
        )
    }

}

const mapStateToProps = ({event}) => {
    return event;
}

export default connect(mapStateToProps)(Event);