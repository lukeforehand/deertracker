import DeviceInfo from 'react-native-device-info';
import base64 from 'react-native-base64';
import Moment from 'moment';

import { api } from './config';

const deviceId = DeviceInfo.getUniqueId();

export default class User {

    static async setPhotoCreditsLeft(photoCreditsLeft) {
        try {
            const formData = new FormData();
            formData.append('photo_credits_left', photoCreditsLeft);
            let response = await fetch(api.url + '/user/' + deviceId, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Basic ' + base64.encode(api.username + ":" + api.password)
                },
                body: formData
            });
            if (response.status !== 200) {
                console.log(JSON.stringify(response));
            }
        } catch (err) {
            console.log(err);
        }
    }

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
            let user = await response.json();
            if ('expiration' in user) {
                let now = new Date();
                if (now > Moment(user.expiration)) {
                    user.photo_credits_left = 0;
                }
            }
            return user;
        } catch (err) {
            console.log(err);
            return null;
        }
    }

}
