import React from 'react';
import {
  SafeAreaView,
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

import Icon from 'react-native-vector-icons/FontAwesome5';

import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker } from 'react-native-maps';

import Database from './Database';

import style, { screenWidth, screenHeight } from './style';

export default class AddLocationScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { modalVisible: false }
  }

  componentDidMount() {
    this.getCurrentPosition();
  }

  render() {
    const locations = this.props.navigation.getParam('locations');
    return (
      <SafeAreaView>
        <View style={style.container}>
          {this.state.region &&
            <MapView
              ref={ref => { this.map = ref; }}
              style={{ ...StyleSheet.absoluteFillObject }}
              showsUserLocation={true}
              mapType="satellite"
              initialRegion={this.state.region}
              onMapReady={() => {
                if (locations.length > 0) {
                  this.map.fitToCoordinates(
                    locations.map(location => ({ latitude: location.lat, longitude: location.lon })),
                    { edgePadding: { top: 120, right: 120, bottom: 120, left: 120 }, animated: true })
                }
              }}
              //onDoublePress={(ev) => { this.map.animateCamera({ center: ev.nativeEvent.coordinate }) }}
              onRegionChangeComplete={(region) => { this.setState({ region: region }) }}>
              {locations.map((location) => {
                return (
                  <Marker key={location['id']}
                    coordinate={{ latitude: location['lat'], longitude: location['lon'] }}>
                    <View>
                      <View style={[style.sightingMarker, {
                        borderColor: `rgb(255, 103, 0)`,
                        backgroundColor: `rgba(255, 103, 0, 0.4)`,
                      }]} />
                      <View style={style.markerContainer}>
                        <View style={{ flexDirection: 'row' }}>
                          <Image source={require('./assets/images/crosshairs.png')} style={{ width: 25, height: 25 }} />
                          <Text style={style.markerLabel}>{location['name']}</Text>
                        </View>
                      </View>
                    </View>
                  </Marker>
                );
              })}
            </MapView>
          }
          <View style={style.markerFixed}>
            <Image source={require('./assets/images/crosshairs.png')} style={{ width: 80, height: 80 }} />
          </View>
          {!this.state.modalVisible &&
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity style={style.mapButton} onPress={() => { this.setState({ modalVisible: true }) }}>
                <Text style={style.h1}>Save Location</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={style.locationArrow} onPress={() => { this.getCurrentPosition() }}>
                  <Icon name='location-arrow' color={style.locationArrow.color} size={15} />
                </TouchableOpacity>
                <TouchableOpacity style={style.locationArrow} onPress={() => {
                  if (locations.length > 0) {
                    this.map.fitToCoordinates(
                      locations.map(location => ({ latitude: location.lat, longitude: location.lon })),
                      { edgePadding: { top: 120, right: 120, bottom: 120, left: 120 }, animated: true })
                  }
                }}>
                  <Icon name='eye' color={style.locationArrow.color} size={15} />
                </TouchableOpacity>
              </View>
            </View>
          }
          {this.state.region &&
            <Modal
              animationType='slide'
              transparent={true}
              onShow={() => { this.location.focus(); }}
              visible={this.state.modalVisible}>
              <View style={style.modal}>
                <TextInput
                  style={style.t2}
                  ref={ref => { this.location = ref; }}
                  onChangeText={(text) => { this.setState({ location: text }) }}
                  selectTextOnFocus={true}
                  defaultValue='Enter location name' />
                <Text style={style.t1}>
                  {this.state.region.latitude.toFixed(5)}, {this.state.region.longitude.toFixed(5)}
                </Text>
                <TouchableOpacity style={style.button} onPress={this.saveLocation.bind(this)}>
                  <Text style={style.h1}>Save</Text>
                </TouchableOpacity>
                <View style={{ height: 15 }} />
              </View>
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
    let location = this.state.location;
    let lat = this.state.region.latitude;
    let lon = this.state.region.longitude;
    if (location && location.length > 0 && location != 'Enter location name') {
      this.db.insertLocation(location, lat, lon).then((rs) => {
        this.db.selectLocations().then((locations) => {
          this.setState({ modalVisible: false });
          this.props.navigation.navigate('LocationScreen', {
            locations: locations
          });
        });
      }).catch((error) => {
        if (error.code && error.code == 6) {
          Alert.alert('That name already exists');
        }
      });
    } else {
      Alert.alert('Enter location name');
    }
  }

  getCurrentPosition() {

    let ASPECT_RATIO = screenWidth / screenHeight;
    let LATITUDE_DELTA = 0.0922;
    let LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

    Geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          region: {
            latitude: parseFloat(position.coords.latitude),
            longitude: parseFloat(position.coords.longitude),
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }
        });
        this.map.animateCamera({ center: position.coords });
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