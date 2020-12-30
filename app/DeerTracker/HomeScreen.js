import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';

import style from './style';

export default class HomeScreen extends React.Component {

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener(
      'didFocus',
      () => {
        this.forceUpdate();
      });
  }
  componentWillUnmount() {
    this.focusListener.remove();
  }

  refreshing() {
    return !this.props.navigation.dangerouslyGetParent().getParam('data');
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

    const data = this.props.navigation.dangerouslyGetParent().getParam('data');

    return (
      <SafeAreaView>
        <ScrollView>
          <View style={style.center}>
            <Text style={style.h1}>{data.name}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

}
