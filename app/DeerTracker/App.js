import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import HomeScreen from './HomeScreen';

const HomeScreenNavigator = createStackNavigator({
  HomeScreen: {
    screen: HomeScreen,
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
      screen: HomeScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Home',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='home' color={tintColor} size={20} />
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
