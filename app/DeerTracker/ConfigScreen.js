import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import Database from './Database';

import style from './style';

export default class ConfigScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true };
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
    let config = this.state.config;
    return (
      <SafeAreaView>
        <ScrollView style={{ height: '100%' }}>
          <View style={style.input}>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={style.h2}>Discard Empty Photos:</Text>
              <Switch
                trackColor={{ false: '#767577', true: 'darkred' }}
                onValueChange={(v) => this.toggle('discard_empty', v)}
                value={config.get('discard_empty') == 'true'}
              />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={style.h2}>Auto Archive Photos:</Text>
              <Switch
                trackColor={{ false: '#767577', true: 'darkred' }}
                onValueChange={(v) => this.toggle('auto_archive', v)}
                value={config.get('auto_archive') == 'true'}
              />
            </View>
            {config.get('auto_archive') == 'true' &&
              <Picker
                selectedValue={config.get('auto_archive_days')}
                style={{ height: 50, width: 100 }}
                onValueChange={(itemValue, itemIndex) => this.pickArchiveDays(itemValue)}>
                <Picker.Item label="3 days" value="3" />
                <Picker.Item label="1 week" value="7" />
                <Picker.Item label="2 weeks" value="14" />
                <Picker.Item label="1 month" value="30" />
              </Picker>
            }
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={style.h2}>Google Drive Key:</Text>
              <TextInput secureTextEntry={true} style={style.h2}>{config.get('google_drive_key')}</TextInput>
            </View>
          </View>
        </ScrollView >
      </SafeAreaView >
    );
  }

  toggle(key, value) {
    this.db.updateConfig(key, new Boolean(value).toString()).then(() => {
      this.fetchData();
    });
  }

  pickArchiveDays(days) {
    this.db.updateConfig('auto_archive_days', days).then(() => {
      this.fetchData();
    });
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectConfig().then((config) => {
      let configMap = new Map(config.map((c) => {
        return [c['key'], c['value']];
      }));
      this.setState({
        isLoading: false,
        config: configMap
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}