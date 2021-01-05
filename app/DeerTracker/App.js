import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import ImportScreen from './ImportScreen';

import LocationScreen from './LocationScreen';

const ImportScreenNavigator = createStackNavigator({
  ImportScreen: {
    screen: ImportScreen,
    navigationOptions: {
      title: 'Pull Card',
      //      headerTitleStyle: {
      //        fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
      //      },
      headerTitleAlign: 'center'
    },
  },
  LocationScreen: {
    screen: LocationScreen,
    navigationOptions: {
      title: 'Locations',
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
        fontSize: 14,
        //fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
      }
    }
  }
);

export default createAppContainer(TabNavigator);
