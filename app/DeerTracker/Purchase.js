import React from 'react';
import {
  Alert,
  Image,
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import * as RNIap from 'react-native-iap';

import User from './User';

import style from './style';

const itemSkus = [
  'com.deertracker.photo_credits.1000',
  'com.deertracker.photo_credits.3000',
  'com.deertracker.photo_credits.5000',
  'com.deertracker.photo_credits.10000',
  'com.deertracker.photo_credits.50000'
];

export default class Purchase extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    }
  }

  componentDidMount() {
    this.purchaseUpdateHandler = RNIap.purchaseUpdatedListener((purchase) => {
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        console.log('recording purchase ' + JSON.stringify(purchase));
        User.getUser().then((user) => {
          if (user === null) {
            return;
          }
          let credits = parseInt(purchase.productId.substring('com.deertracker.photo_credits.'.length));
          User.setPhotoCredits(user.photo_credits + credits).then(() => {
            RNIap.finishTransaction(purchase, false)
              .then(() => {
                // refresh products
                this.getProducts();
              })
              .catch((error) => {
                console.log(error);
              });
          });
        });
      }
    });
    this.purchaseErrorHandler = RNIap.purchaseErrorListener((error) => {
      console.log(error);
      if (error.code === 'E_USER_CANCELLED') {
        return;
      }
      Alert.alert('Problem with completing purchase');
    });
    this.getProducts();
  }

  componentWillUnmount() {
    this.purchaseUpdateHandler.remove();
    this.purchaseErrorHandler.remove();
  }

  refreshing() {
    return this.state.isLoading;
  }

  render() {
    if (this.refreshing()) {
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size='large' />
        </View>
      );
    }
    return (
      <View>
        {this.state.products.map((product) => {
          return (
            <View key={product.productId}>
              <TouchableOpacity
                key={product.productId}
                style={style.locationButton}
                onPress={() => { this.purchase(product) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('./assets/images/crosshairs.png')} style={{ margin: 10, width: 30, height: 30 }} />
                  <Text style={[style.t4, { marginLeft: -5, width: 70 }]}>{product.localizedPrice}</Text>
                  <Text style={[style.t4, { marginLeft: -5 }]}>{product.title}</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  }

  getProducts() {
    RNIap.initConnection().then(() => {
      RNIap.flushFailedPurchasesCachedAsPendingAndroid().catch((error) => {
        console.log(error);
      }).then(RNIap.getProducts(itemSkus)
        .then((products) => {
          products = products.sort(function (a, b) {
            return new Number(a.price) > new Number(b.price);
          });
          this.setState({
            products: products,
            isLoading: false
          });
        })
        .catch((error) => {
          console.log(error);
        })
      ).catch((error) => {
        console.log(error);
      });
    });
  }

  purchase(product) {
    RNIap.requestPurchase(product.productId, false, product.productId)
      .then((purchase) => {
        // purchase callback, before receipt
      })
      .catch((error) => {
        console.log(error);
      });
  }

}
