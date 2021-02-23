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

import style from './style';

const itemSkus = Platform.select({
  ios: ['1_yr_50k', '1_yr_100k', '1_yr_500k'],
  android: ['1_yr_50k', '1_yr_100k', '1_yr_500k'],
});

export default class Subscribe extends React.Component {

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
        //TODO: record purchase in server.py
        transactionDate
        productId


        RNIap.finishTransaction(purchase, false)
          .then(() => {
            // refresh products
            this.getSubscriptions();
          })
          .catch((error) => {
            console.log(error);
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
    this.getSubscriptions();
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
                <View style={{ flexDirection: 'row' }}>
                  <Image source={require('./assets/images/crosshairs.png')} style={{ margin: 10, width: 60, height: 60 }} />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={style.t4}>{product.localizedPrice}</Text>
                    <Text style={style.h2}>{product.description}</Text>
                    <View style={{ height: 20 }} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  }

  getSubscriptions() {
    RNIap.initConnection().then(() => {
      RNIap.flushFailedPurchasesCachedAsPendingAndroid().catch((error) => {
        console.log(error);
      }).then(RNIap.getSubscriptions(itemSkus)
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
    RNIap.requestSubscription(product.productId, false, product.productId)
      .then((purchase) => {
        // purchase callback, before receipt
      })
      .catch((error) => {
        console.log(error);
      });
  }

}
