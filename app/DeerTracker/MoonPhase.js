
export default class MoonPhase {
    // 1980 January 0.0 in JDN
    epoch = 2444238.5;

    // Ecliptic longitude of the Sun at epoch 1980.0
    ecliptic_longitude_epoch = 278.83354;

    // Ecliptic longitude of the Sun at perigee
    ecliptic_longitude_perigee = 282.596403;

    // Eccentricity of Earth's orbit
    eccentricity = 0.016718;

    // Moon's mean longitude at the epoch
    moon_mean_longitude_epoch = 64.975464;

    // Mean longitude of the perigee at the epoch
    moon_mean_perigee_epoch = 349.383063;

    // Synodic month (new Moon to new Moon), in days
    synodic_month = 29.53058868;

    phase_strings = {
        0.05: 'New Moon',
        0.20: 'Waxing Crescent',
        0.30: 'First Quarter',
        0.45: 'Waxing Gibbous',
        0.55: 'Full Moon',
        0.70: 'Waning Gibbous',
        0.80: 'Last Quarter',
        0.95: 'Waning Crescent',
        1.05: 'New Moon',
    };

    juliandate(date) {
        return date.getTime() / 86400000 + 2440587.5;
    }

    kepler(m, ecc) {
        var epsilon = 1e-6;
        var m = this.torad(m);
        var e = m;
        while (true) {
            var delta = e - ecc * Math.sin(e) - m;
            e = e - delta / (1.0 - ecc * Math.cos(e));
            if (Math.abs(delta) <= epsilon) {
                break;
            }
        }
        return e;
    }

    fixangle(a) {
        return a - 360.0 * Math.floor(a / 360.0);
    }

    torad(d) {
        return (d * Math.PI) / 180.0;
    }

    todeg(r) {
        return (r * 180.0) / Math.PI;
    }

    phase(date, dayOffset = 0) {

        date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
        date.setDate(date.getDate() + dayOffset);

        var day = this.juliandate(date) - this.epoch;

        // Mean anomaly of the Sun
        N = this.fixangle((360 / 365.2422) * day);

        // Convert from perigee coordinates to epoch 1980
        M = this.fixangle(N + this.ecliptic_longitude_epoch - this.ecliptic_longitude_perigee);

        // Solve Kepler's equation
        Ec = this.kepler(M, this.eccentricity);
        Ec = Math.sqrt((1 + this.eccentricity) / (1 - this.eccentricity)) * Math.tan(Ec / 2.0);

        // True anomaly
        Ec = 2 * this.todeg(Math.atan(Ec));

        // Suns's geometric ecliptic longuitude
        lambda_sun = this.fixangle(Ec + this.ecliptic_longitude_perigee);

        // Calculation of the Moon's position

        // Moon's mean longitude
        moon_longitude = this.fixangle(13.1763966 * day + this.moon_mean_longitude_epoch);

        // Moon's mean anomaly
        MM = this.fixangle(moon_longitude - 0.1114041 * day - this.moon_mean_perigee_epoch);

        // Moon's ascending node mean longitude
        evection = 1.2739 * Math.sin(this.torad(2 * (moon_longitude - lambda_sun) - MM));

        // Annual equation
        annual_eq = 0.1858 * Math.sin(this.torad(M));

        // Correction term
        A3 = 0.37 * Math.sin(this.torad(M));

        MmP = MM + evection - annual_eq - A3;

        // Correction for the equation of the centre
        mEc = 6.2886 * Math.sin(this.torad(MmP));

        // Another correction term
        A4 = 0.214 * Math.sin(this.torad(2 * MmP));

        // Corrected longitude
        lP = moon_longitude + evection + mEc - annual_eq + A4;

        // Variation
        variation = 0.6583 * Math.sin(this.torad(2 * (lP - lambda_sun)));

        // True longitude
        lPP = lP + variation;

        // Age of the Moon, in degrees
        moon_age = lPP - lambda_sun;

        // Phase of the Moon
        moon_phase = (1 - Math.cos(this.torad(moon_age))) / 2.0;

        phase = this.fixangle(moon_age) / 360.0;

        for (var key in this.phase_strings) {
            if (phase < key) {
                phase_name = this.phase_strings[key];
                break;
            }
        }

        return {
            date: date,
            age: (this.synodic_month * this.fixangle(moon_age)) / 360.0,
            phase: phase,
            name: phase_name,
            illuminated: (moon_phase * 100).toFixed(1) + '%',
        };

    }

    image(phase_name) {
        let name = phase_name;
        switch (name) {
            case 'Waxing Gibbous': return require('./assets/images/moons/moon_waxg.png');
            case 'Waxing Crescent': return require('./assets/images/moons/moon_waxc.png');
            case 'Waning Gibbous': return require('./assets/images/moons/moon_wang.png');
            case 'Waning Crescent': return require('./assets/images/moons/moon_wanc.png');
            case 'New Moon': return require('./assets/images/moons/moon_new.png');
            case 'Last Quarter': return require('./assets/images/moons/moon_lq.png');
            case 'Full Moon': return require('./assets/images/moons/moon_full.png');
            case 'First Quarter': return require('./assets/images/moons/moon_fq.png');
            default: throw new Error('Could not load moon image ' + name);
        }
    }

}
