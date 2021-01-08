import React from 'react';
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Image,
  View
} from 'react-native';

import Swipeable from 'react-native-gesture-handler/Swipeable';

import style from './style';

const screenWidth = Dimensions.get('window').width;

export default class PhotoScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = { isLoading: true }
  }

  componentDidMount() {
    this.setState({
      file: this.props.navigation.getParam('file'),
      files: this.props.navigation.getParam('files'),
      isLoading: false
    })
  }

  refreshing() {
    return this.state.isLoading;
  }

  renderRightActions(progress) {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [screenWidth, 0],
    });
    // FIXME:
    //const index = this.state.files.indexOf(this.state.file);
    //const nextFile = this.state.files[index + 1];
    //this.setState({
    //      file: nextFile
    //});
    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <View style={style.photoContainer}>
          <Image source={{ uri: this.state.file.path }} style={style.photo} />
        </View>
      </Animated.View >
    );
  }

  updateRef = ref => {
    this._swipeableRow = ref;
  };

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
        <Swipeable
          ref={this.updateRef}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={40}
          leftThreshold={40}
          renderRightActions={this.renderRightActions.bind(this)}>
          <View style={style.photoContainer}>
            <Image source={{ uri: this.state.file.path }} style={style.photo} />
          </View>
        </Swipeable>
      </SafeAreaView>
    );
  }
}
