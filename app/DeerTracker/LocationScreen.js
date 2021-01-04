import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Text,
  TextInput,
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
        <View style={style.map}>
          <MapView
            ref={ref => { this.map = ref; }}
            style={{ ...StyleSheet.absoluteFillObject }}
            showsUserLocation={true}
            mapType="satellite"
            initialRegion={this.state.region}
            region={this.state.region}
            onDoublePress={(ev) => { this.map.animateCamera({ center: ev.nativeEvent.coordinate }) }}
            onRegionChangeComplete={(region) => { this.setState({ region: region }) }}>
          </MapView>
          <View style={style.markerFixed}>
            <Image source={require('./assets/images/crosshairs.png')} style={{ width: 100, height: 100 }} />
          </View>
          {!this.state.modalVisible &&
            <TouchableOpacity style={style.button} onPress={() => { this.setState({ modalVisible: true }) }}>
              <Text style={style.h1}>Save Location</Text>
            </TouchableOpacity>
          }
          {this.state.region &&
            <Modal
              animationType="slide"
              transparent={true}
              visible={this.state.modalVisible}>
              <View style={style.modal}>
                <TextInput
                  style={style.h1}
                  onChangeText={(text) => { this.setState({ locationName: text }) }}
                  selectTextOnFocus={true}
                  defaultValue="Enter location name" />
                <Text style={style.t1}>
                  {this.state.region.latitude.toFixed(5)}, {this.state.region.longitude.toFixed(5)}
                </Text>
              </View>
              <TouchableOpacity style={style.button} onPress={this.saveLocation.bind(this)}>
                <Text style={style.h1}>Save</Text>
              </TouchableOpacity>
              <TouchableWithoutFeedback onPress={() => { this.setState({ modalVisible: false }) }}>
                <View style={{ flex: 1 }} />
              </TouchableWithoutFeedback>
            </Modal>
          }
        </View>
      </SafeAreaView >
    );
  }

  saveLocation() {
    // FIXME: insert location
    alert(this.state.locationName + " " + this.state.region.latitude + " " + this.state.region.longitude);
    this.setState({ modalVisible: false })
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    Geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          region: {
            latitude: parseFloat(position.coords.latitude),
            longitude: parseFloat(position.coords.longitude),
            latitudeDelta: 0.001,
            longitudeDelta: 0.001
          }
        });
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    ).then(this.db.selectBatches().then((rs) => {
      console.log(rs);
      this.setState({
        isLoading: false,
        data: rs
      });
    }).catch((error) => {
      console.log(error);
    }));
  }

}