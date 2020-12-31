import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import ImportScreen from './ImportScreen';

const ImportScreenNavigator = createStackNavigator({
  ImportScreen: {
    screen: ImportScreen,
    navigationOptions: {
      title: 'DeerTracker',
      //      headerTitleStyle: {
      //        fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
      //      },
      headerTitleAlign: 'center'
    },
  },
});


const TabNavigator = createBottomTabNavigator(
  {
    Home: {
      screen: ImportScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Pull Card',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='upload' style={{ transform: [{ rotateX: '180deg' }] }} color={tintColor} size={20} />
        )
      }
    },
  },
  {
    tabBarOptions: {
      labelStyle: {
        fontSize: 10,
        //fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
      }
    }
  }
);

export default createAppContainer(TabNavigator);
