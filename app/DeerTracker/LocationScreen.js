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
  Alert,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker } from 'react-native-maps';

import Database from './Database';

import style from './style';

export default class LocationScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, modalVisible: false }
  }

  static getDerivedStateFromProps(props, state) {
    locations = props.navigation.getParam('locations');
    return locations === undefined || locations === state.locations ? {} : {
      locations
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
        <View style={style.container}>
          <MapView
            ref={ref => { this.map = ref; }}
            style={{ ...StyleSheet.absoluteFillObject }}
            showsUserLocation={true}
            mapType="satellite"
            initialRegion={this.state.region}
            region={this.state.region}
            onDoublePress={(ev) => { this.map.animateCamera({ center: ev.nativeEvent.coordinate }) }}
            onRegionChangeComplete={(region) => { this.setState({ region: region }) }}>
            {this.state.locations.map((location) => {
              return (
                <Marker key={location['id']}
                  coordinate={{ latitude: location['lat'], longitude: location['lon'] }}
                  title={location['name']}>
                </Marker>
              );
            })}
          </MapView>
          <View style={style.markerFixed}>
            <Image source={require('./assets/images/crosshairs.png')} style={{ width: 80, height: 80 }} />
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
              onShow={() => { this.location.focus(); }}
              visible={this.state.modalVisible}>
              <View style={style.modal}>
                <TextInput
                  style={style.t2}
                  ref={ref => { this.location = ref; }}
                  onChangeText={(text) => { this.setState({ location: text }) }}
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
    location = this.state.location;
    lat = this.state.region.latitude;
    lon = this.state.region.longitude;
    if (location && location.length > 0 && location != "Enter location name") {
      this.db.insertLocation(location, lat, lon).then((rs) => {
        this.db.selectLocations().then((locations) => {
          this.props.navigation.navigate('ImportScreen', {
            locations: locations
          });
        });
      }).catch((error) => {
        if (error.code && error.code == 6) {
          Alert.alert("That name already exists");
        }
      });
    } else {
      Alert.alert("Enter location name");
    }
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    Geolocation.getCurrentPosition(
      (position) => {
        this.db.selectLocations().then((locations) => {
          this.setState({
            isLoading: false,
            locations: locations,
            region: {
              latitude: parseFloat(position.coords.latitude),
              longitude: parseFloat(position.coords.longitude),
              latitudeDelta: 0.001,
              longitudeDelta: 0.001
            }
          });
        });
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    ).catch((error) => {
      console.log(error);
    });
  }

}