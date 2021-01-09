import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
  View,
  TouchableOpacity
} from 'react-native';

import Moment from 'moment';

import Database from './Database';

import style from './style';

export default class BatchScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
  }

  static getDerivedStateFromProps(props, state) {
    // state may come from initial fetch, or from ImportScreen
    batches = props.navigation.getParam('batches');
    return batches === undefined || batches === state.batches ? {} : {
      batches: batches
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  refreshing() {
    return this.state.isLoading;
  }

  render() {
    if (this.refreshing()) {
      return (
        <SafeAreaView>
          <View style={style.activity}>
            <ActivityIndicator size='large' />
          </View>
        </SafeAreaView>
      )
    }
    return (
      <SafeAreaView>
        <ScrollView>
          {this.state.batches.map((batch) => {
            return (
              <TouchableOpacity key={batch['id']} style={style.locationButton}>
                <Text style={style.h2}>
                  {Moment(new Date(batch['time'])).format('ddd, MMM Do YYYY hh:mm A')}
                </Text>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <Text style={style.t4}>
                    Batch {batch['id']}{'\n'}
                    Location: {batch['location_name']}{'\n'}
                    Photos:{batch['num_photos']}{'\n'}
                  </Text>
                  {batch['photo_path'] &&
                    <Image source={{ uri: batch['photo_path'] }} style={style.smallThumbnail} />
                  }
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView >
    );
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectBatches().then((batches) => {
      this.setState({
        isLoading: false,
        batches: batches
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}