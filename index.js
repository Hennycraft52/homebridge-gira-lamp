let Service, Characteristic;
const Lamp = require('./lib/lamp');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-gira-lamp', 'Lamp', LampAccessory);
};

function LampAccessory(log, config) {
    this.log = log;
    this.lamp = new Lamp(config.ip, config.lampid, config.username, config.password);
}

LampAccessory.prototype = {
    getServices: function() {
        let lightbulbService = new Service.Lightbulb(this.name);

        lightbulbService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getOn.bind(this))
            .on('set', this.setOn.bind(this));

        return [lightbulbService];
    },

    getOn: function(callback) {
        this.lamp.getStatus().then(status => {
            callback(null, status > 0);
        }).catch(err => {
            callback(err);
        });
    },

    setOn: function(value, callback) {
        this.lamp.setStatus(value ? 1 : 0).then(() => {
            callback(null);
        }).catch(err => {
            callback(err);
        });
    }
};
