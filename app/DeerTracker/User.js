import DeviceInfo from 'react-native-device-info';
import base64 from 'react-native-base64';

import { api } from './config';

const deviceId = DeviceInfo.getUniqueId();

export default class User {

    static async getUser() {
        try {
            let response = await fetch(api.url + '/user/' + deviceId, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + base64.encode(api.username + ":" + api.password)
                }
            });
            if (response.status !== 200) {
                console.log(JSON.stringify(response));
                return null;
            }
            return await response.json();
        } catch (err) {
            console.log(err);
            return null;
        }
    }

}
