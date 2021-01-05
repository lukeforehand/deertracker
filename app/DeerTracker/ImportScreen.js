import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
  View,
  TouchableOpacity
} from 'react-native';

import Database from './Database';

import style from './style';

export default class ImportScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
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
        <ScrollView style={style.container}>
          {this.state.locations.map((location) => {
            return (
              <TouchableOpacity key={location['id']} style={style.locationButton}>
                <View style={{ flexDirection: 'row' }}>
                  <Image source={require('./assets/images/crosshairs.png')} style={{ margin: 10, width: 80, height: 80 }} />
                  <View>
                    <Text style={style.h2}>{location['name']}</Text>
                    <Text style={style.h2}>({location['lat'].toFixed(5)}, {location['lon'].toFixed(5)})</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={style.button} onPress={this.onButtonPress.bind(this)}>
            <Text style={style.h1}>Add Location</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView >
    );
  }

  onButtonPress() {
    this.props.navigation.navigate('LocationScreen');
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