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

import Database from './Database';
import SwipeRow from './SwipeRow';

import style from './style';

export default class LocationScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
  }

  static getDerivedStateFromProps(props, state) {
    // state may come from initial fetch of data, or from AddLocationScreen
    locations = props.navigation.getParam('locations');
    return locations === undefined || locations === state.locations ? {} : {
      locations: locations
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
          <TouchableOpacity style={style.button} onPress={() => {
            this.props.navigation.navigate('AddLocationScreen', {
              locations: this.state.locations
            })
          }}>
            <Text style={style.h1}>Add Location</Text>
          </TouchableOpacity>
          {this.state.locations.map((location) => {
            return (
              <SwipeRow key={location['id']} item={location} onDelete={this.deleteLocation.bind(this)}>
                <TouchableOpacity
                  key={location['id']}
                  style={style.locationButton}
                  onPress={() => { this.props.navigation.navigate('ImportScreen', { location: location }) }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Image source={require('./assets/images/crosshairs.png')} style={{ margin: 10, width: 80, height: 80 }} />
                    <View>
                      <Text style={style.h2}>{location['name']}</Text>
                      <Text style={style.h2}>({location['lat'].toFixed(5)}, {location['lon'].toFixed(5)})</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </SwipeRow>
            );
          })}
        </ScrollView>
      </SafeAreaView >
    );
  }

  deleteLocation(location, callback) {
    Alert.alert(
      'Delete Location ' + location['name'] + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          this.db.deleteLocation(location['id']).then(() => {
            this.db.selectLocations().then((locations) => {
              this.props.navigation.navigate('LocationScreen', {
                locations: locations
              });
            });
          });
          callback();
        }
      },
      { text: 'No', onPress: callback }], { cancelable: false });
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectLocations().then((locations) => {
      this.setState({
        isLoading: false,
        locations: locations
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}