import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import RNFS from 'react-native-fs';
import Moment from 'moment';

import SwipeRow from './SwipeRow';
import Database from './Database';

import style, { thumbWidth } from './style';

const root = RNFS.DocumentDirectoryPath;

export default class ProfileListScreen extends React.Component {

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

    const profiles = this.state.profiles;

    return (
      <SafeAreaView>
        <ScrollView style={{ height: '100%' }} refreshControl={
          <RefreshControl
            title='Refresh'
            titleColor='black'
            tintColor='black'
            refreshing={this.refreshing()} onRefresh={this.fetchData.bind(this)} />
        }>
          {profiles.length <= 0 &&
            <Text style={style.t3}>Review sightings to add a profile</Text>
          }
          {profiles.length > 0 &&
            <Text style={style.t3}>Select a profile</Text>
          }
          {profiles.map((profile) => {
            let crop = profile.objects[0];
            let ratio = thumbWidth / crop.width;
            let row = (<TouchableOpacity
              key={crop.profile_name}
              style={style.locationButton}
              onPress={() => { this.props.navigation.navigate('ProfileScreen', { profile: profile }) }}>
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', margin: 10 }}>
                    <Image source={require('./assets/images/crosshairs.png')} style={{ width: 25, height: 25 }} />
                    <Text style={style.h2}>{crop.profile_name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <Icon style={{ paddingLeft: 15 }} name='eye' color='black' size={18} />
                    <Text style={style.t5}>{profile.objects.length} Sightings</Text>
                  </View>
                  <Text style={style.t5}>Last seen {Moment(new Date() - Moment(crop.time)).format('D')} days ago</Text>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>

                  <Image source={{ uri: root + '/' + crop.photo_path }}
                    style={{ width: parseInt(thumbWidth), height: parseInt(crop.height * ratio) }} />
                  <View style={{
                    ...StyleSheet.absoluteFillObject,
                    left: parseInt(crop.x * ratio),
                    top: parseInt(crop.y * ratio),
                    width: parseInt(crop.w * ratio),
                    height: parseInt(crop.h * ratio),
                    borderWidth: 1,
                    borderColor: 'rgb(255, 103, 0)'
                  }} />

                </View>
              </View>
            </TouchableOpacity>);
            if (profile.type === 'profile') {
              return (
                <SwipeRow key={crop.profile_name} item={crop} onDelete={this.deleteProfile.bind(this)}>{row}</SwipeRow>
              );
            } else {
              return row;
            }
          })}
        </ScrollView>
      </SafeAreaView >
    );
  }

  deleteProfile(profile, callback) {
    Alert.alert(
      'Delete Profile ' + profile.profile_name + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          this.db.deleteProfile(profile.profile_id).then(() => {
            this.fetchData();
          });
          callback();
        }
      },
      { text: 'No', onPress: callback }], { cancelable: false });
  }

  fetchData() {
    this.db.selectProfiles().then((profiles) => {
      this.db.selectClasses().then((classes) => {
        profiles = profiles.concat(classes);
        profiles.map((profile) => {
          profile.objects.map((photo) => {
            photo.url = root + '/' + photo.photo_path;
            photo.props = {
              photo: photo
            };
            photo.objects = [photo];
          });
        });
        this.setState({
          isLoading: false,
          profiles: profiles
        });
      })
    }).catch((error) => {
      console.log(error);
    });
  }
}