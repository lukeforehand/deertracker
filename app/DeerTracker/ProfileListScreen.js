import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import RNFS from 'react-native-fs';
import Moment from 'moment';

import SwipeRow from './SwipeRow';
import Database from './Database';

import style, { thumbWidth, thumbHeight } from './style';

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
            crop.path = RNFS.CachesDirectoryPath + '/crop_' + crop.id + '.jpg';
            let w = thumbWidth;
            let h = (thumbWidth / crop.w) * crop.h;
            return (
              <SwipeRow key={crop.profile_name} item={crop} onDelete={this.deleteProfile.bind(this)}>
                <TouchableOpacity
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
                    <View style={{ width: thumbWidth, height: thumbHeight, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={{ uri: crop.path }} style={{ width: w, height: Math.min(w, h) }} />
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
    console.log(profile);
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
      this.setState({
        isLoading: false,
        profiles: profiles
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}