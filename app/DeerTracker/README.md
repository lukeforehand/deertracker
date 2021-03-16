# Install

add config.js
```js
export const apiUrl = "http://localhost:8080";
export const apiUsername = "username";
export const apiPassword = "password";
```


```bash
npm install
npx pod-install ios

react-native link
# remove font copy in the [CP] Copy Pods Resources section in Xcode
```

```bash
npx react-native run-ios
```

or

required patch:
https://github.com/itinance/react-native-fs/pull/851/files

```bash
npx react-native run-android
```
