// Homebridge-Code für Lampen
const { toggleLamp, getLampStatus } = require('./lib/lamp');

module.exports = (homebridge) => {
    const Accessory = homebridge.hap.Accessory;
    const Service = homebridge.hap.Service;
    const Characteristic = homebridge.hap.Characteristic;

    class LampAccessory {
        constructor(log, config) {
            this.log = log;
            this.name = config.name;
            this.ip = config.ip;
            this.lampId = config.lampId;
            this.username = config.username;
            this.password = config.password;

            this.service = new Service.Lightbulb(this.name);
            this.lastKnownState = 0; // Speichern Sie den letzten bekannten Zustand

            this.service
                .getCharacteristic(Characteristic.On)
                .on('get', this.getState.bind(this))
                .on('set', this.setState.bind(this));

            // Abrufen des aktuellen Status beim Start
            this.getState((err, state) => {
                if (!err) {
                    this.service
                        .getCharacteristic(Characteristic.On)
                        .updateValue(state);
                    this.lastKnownState = state;
                }
            });

            // Aktualisieren Sie den Status alle 5 Sekunden
            this.statusUpdateInterval = setInterval(() => {
                this.getState((err, state) => {
                    if (!err && this.lastKnownState !== state) {
                        this.service
                            .getCharacteristic(Characteristic.On)
                            .updateValue(state);
                        this.lastKnownState = state;
                    }
                });
            }, 5000);
        }

        getState(callback) {
            getLampStatus(this.ip, this.lampId, this.username, this.password)
                .then((status) => {
                    const state = status === 1 ? true : false;
                    callback(null, state);
                })
                .catch((error) => {
                    this.log('Error getting lamp status:', error);
                    callback(error);
                });
        }

        setState(value, callback) {
            if (value !== this.lastKnownState) {
                toggleLamp(this.ip, this.lampId, this.username, this.password)
                    .then(() => {
                        setTimeout(() => {
                            this.getState((err, newState) => {
                                if (!err) {
                                    this.service
                                        .getCharacteristic(Characteristic.On)
                                        .updateValue(newState);
                                    this.lastKnownState = newState;
                                }
                            });
                        }, 1000);
                        callback(null);
                    })
                    .catch((error) => {
                        this.log('Error setting lamp state:', error);
                        callback(error);
                    });
            } else {
                callback(null);
            }
        }

        getServices() {
            return [this.service];
        }
    }

    homebridge.registerAccessory('homebridge-lamp', 'LampV1', LampAccessory);
};
