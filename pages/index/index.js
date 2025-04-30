// index.js
import mqtt from "../../utils/mqtt_library/mqtt.min"
import crypto from "../../utils/mqtt_library/hex_hmac_sha1"

const app = getApp()
let client = null
Page({
    /**
     *  About connect MQTT broker code
     */
    //mqtt device config parameters
    data: {
        productKey: app.globalData.productKey,
        deviceName: app.globalData.deviceName,
        deviceSecret: app.globalData.deviceSecret,
        isConnected: false,
        isConnecting: false,
        buttonColor: '#45a049'
    },
    //load index page to execute
    onLoad() {
        //this.doConnect();
    },
    onUnload() {
        if (app.globalData.client) {
            app.globalData.client.end(true); // 强制关闭残留连接
        }
    },
    toggleMqttConnection() {
        if (this.data.isConnected) {
            // 断开连接
            app.globalData.client.end();
            wx.showLoading({ title: '断开中...', mask: true });
            setTimeout(() => {
                wx.hideLoading();
                wx.showToast({
                    title: '断开成功 ✅',
                    icon: 'none',
                    duration: 1500
                });
                // 修改按钮背景颜色
                this.setData({
                    isConnected: false,
                    buttonColor: '#45a049' // 断开时按钮变红
                });
            }, 500);
        } else {
            // 连接
            this.setData({ isConnecting: true });
            wx.showLoading({ title: '连接中...', mask: true });

            const timeoutId = setTimeout(() => {
                if (!this.data.isConnected) {
                    wx.hideLoading();
                    wx.showToast({
                        title: '连接超时 ❌',
                        icon: 'none',
                        duration: 2000
                    });
                    this.setData({ isConnecting: false });
                }
            }, 4000);

            this.doConnect()
                .then((success) => {
                    clearTimeout(timeoutId);
                    wx.hideLoading();
                    this.setData({ isConnecting: false });
                    if (success) {
                        wx.showToast({
                            title: '连接成功 ✅',
                            icon: 'none',
                            duration: 1500
                        });
                        // 修改按钮背景颜色
                        this.setData({
                            isConnected: true,
                            buttonColor: '#ffcccc' // 连接成功时按钮变绿
                        });
                    }
                })
                .catch((err) => {
                    clearTimeout(timeoutId);
                    wx.hideLoading();
                    wx.showToast({
                        title: `连接失败 ❌：${err.message}`,
                        icon: 'none',
                        duration: 2000
                    });
                    this.setData({ isConnecting: false });
                });
        }
    },

    //connect mqtt broker
    async doConnect() {
        return new Promise((resolve, reject) => {
            var that = this;
            console.log("counting connect parameters......");
            const options = this.initMqttOptions(this.data);
            console.log(options);
            console.log("start connecting mqtt......");
            client = mqtt.connect( "wxs://" + app.globalData.mqttHost, options)
            app.globalData.client = client; //copy mqtt app.globalData.client to global variable
            app.globalData.client.once('connect', () => {
                console.log('设备连接服务器成功');
                that.setData({
                    isConnected: true
                });
                resolve(true);
            });
            app.globalData.client.once('error', (err) => {
                reject(err);
            });
            app.globalData.client.on('connect', function () {
                //订阅主题
                app.globalData.client.subscribe(app.globalData.deviceSubcribe, function (err) {
                    if (!err) {

                    } else {
                        console.log("sbucribe failed.");
                    }
                });
                that.setData({
                    isConnected: true
                });
            });
            // 接收消息
            app.globalData.client.on('message', function (topic, message) {
                //console.log(message.toString())
            });
            //device disconnect actively
            app.globalData.client.on('close', function () {
                console.log('设备已断开连接');
                wx.showToast({
                    title: '连接已断开 ❌',
                    icon: 'none',
                    duration: 1500
                });
            });
            //device reconnect accrod to interval time
            app.globalData.client.on('reconnect', function () {
                console.log('设备正在重新连接，请稍等......');
            });
            //device disconnect passively by broker
            app.globalData.client.on('disconnect', function (packet) {
                console.log(packet);
            });
            //device offline
            app.globalData.client.on('offline', function () {
                console.log('offline');
            });
            //device connect error
            app.globalData.client.on('error', function (error) {
                console.log(error);
            });
        });
    },
    //IoT平台mqtt连接参数初始化
    initMqttOptions() {
        const params = {
            productKey: app.globalData.productKey,
            deviceName: app.globalData.deviceName,
            timestamp: Date.now(),
            clientId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        //CONNECT参数
        const options = {
            reconnectPeriod: 1000, //reconnect time
            connectTimeout: 4000, //connect more than time
            keepalive: 60, //60s
            clean: true, //cleanSession不保持持久会话
            protocolVersion: 4,//MQTT v3.1.1
            will: {
                topic: app.globalData.devicePublish,
                payload: "device had connected",
                QoS: 1,
                retain: 1,
            }
        }
        //生成clientId，username，password
        options.password = this.signHmacSha1(params, app.globalData.deviceSecret);
        options.clientId = `${params.clientId}|securemode=2,signmethod=hmacsha1,timestamp=${params.timestamp}|`;
        options.username = `${params.deviceName}&${params.productKey}`;
        return options;
    },
    //count to get password
    signHmacSha1(params, deviceSecret) {
        let keys = Object.keys(params).sort();
        // 按字典序排序
        keys = keys.sort();
        const list = [];
        keys.map((key) => {
            list.push(`${key}${params[key]}`);
        });
        const contentStr = list.join('');
        return crypto.hex_hmac_sha1(deviceSecret, contentStr);
    },

    /**
     * About view and logic code
     */
    //input three paramerters for mqtt event
    handleInputMqttParameters(e) {
        const { field } = e.currentTarget.dataset;
        this.setData({ [field]: e.detail.value })
    },
    //step to debug apge
    navigateToDebugPage() {
        wx.navigateTo({
            url: '/pages/com/com'
        })
    },
    //step to control page
    navigateToControlPage() {
        wx.navigateTo({
            url: '/pages/control/control'
        })
    },
    //step to attitude page
    navigateToAttitudePage() {
        wx.navigateTo({
            url: '/pages/attitude/attitude'
        })
    }
})