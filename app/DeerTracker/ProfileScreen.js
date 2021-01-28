import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';

import RNFS from 'react-native-fs';

import SwipeRow from './SwipeRow';

import MoonPhase from './MoonPhase';
import Database from './Database';

import style from './style';

export default class ProfileScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate() {
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

    const profiles = this.state.profiles;

    return (
      <SafeAreaView>
        <ScrollView style={{ height: '100%' }}>
          {profiles.length <= 0 &&
            <Text style={style.t3}>Review sightings to add a profile</Text>
          }
          {profiles.map((profile) => {
            return (
              <SwipeRow key={profile.id} item={profile} onDelete={this.deleteProfile.bind(this)}>
                <TouchableOpacity
                  style={style.locationButton}
                  onPress={() => { this.getProfile(profile) }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Image source={require('./assets/images/crosshairs.png')} style={{ margin: 10, width: 60, height: 60 }} />
                    <View style={{ justifyContent: 'center' }}>
                      <Text style={style.h2}>{profile.name}</Text>
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

  deleteProfile(profile, callback) {
    Alert.alert(
      'Delete Profile ' + profile.name + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          this.db.deleteProfile(profile.id).then(() => {
            this.fetchData();
          });
          callback();
        }
      },
      { text: 'No', onPress: callback }], { cancelable: false });
  }

  fetchData() {
    this.db.selectProfiles().then((profiles) => {
      this.setState({
        isLoading: false,
        profiles: profiles
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}