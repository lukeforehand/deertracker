import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  Image,
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import MapView, { Callout, Marker } from 'react-native-maps';

import Database from './Database';

import style from './style';

export default class LocationScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, modalVisible: false }
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
          <View style={style.map}>
            <MapView
              style={{ ...StyleSheet.absoluteFillObject }}
              showsUserLocation={true}
              mapType="satellite"
              region={this.state.initialRegion}>
              <Marker draggable
                coordinate={this.state.location}
                onDragEnd={(e) => this.setState({ modalVisible: true, location: e.nativeEvent.coordinate })}>
                <Image source={require('./assets/images/crosshairs.png')} style={{ width: 100, height: 100 }} />
              </Marker>
            </MapView>
            <Modal
              animationType="slide"
              transparent={true}
              visible={this.state.modalVisible}>
              <View style={style.modal}>
                {this.state.location &&
                  <Text>{this.state.location.latitude}, {this.state.location.longitude}</Text>
                }
                <Button title="Save Location" onPress={this.saveLocation.bind(this)} />
              </View>
            </Modal>
          </View>
        </ScrollView >
      </SafeAreaView >
    );
  }

  saveLocation() {
    // FIXME: insert location
    alert(this.state.location.latitude)
    this.setState({ modalVisible: false })
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    Geolocation.getCurrentPosition(
      (position) => {
        let region = {
          latitude: parseFloat(position.coords.latitude),
          longitude: parseFloat(position.coords.longitude),
          latitudeDelta: 0.0009,
          longitudeDelta: 0.0009
        };
        this.setState({
          location: position.coords,
          initialRegion: region
        });
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );


    this.db.selectBatches().then((rs) => {
      console.log(rs);
      this.setState({
        isLoading: false,
        data: rs
      });
    }).catch((error) => {
      console.log(error);
    });
  }

}