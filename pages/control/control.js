const app = getApp();
Page({
    data: {
        isFlying: false,
        status: "待机中",
        battery: 85,
        loading: false,
        takeoffInProgress: false,
    },
    onReady() {
        const that = this;
        this.loopTimer = setInterval(() => {
            const payload = JSON.stringify({ ONL: 1 });
            if (app.globalData.client) {
                app.globalData.client.publish(app.globalData.devicePublish, payload);
                console.log('[定时发送] ', payload);
            }
        }, 1000); // 每 1000ms 执行一次
    },
    stopTask() {
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
            this.setData({ sending: false });
            wx.showToast({ title: '已停止发送', icon: 'none' });
        }
    },
    onUnload() {
        // 页面卸载时也清除
        this.stopTask();
        const payload = JSON.stringify({ STP: 1 });
        if (app.globalData.client) {
            app.globalData.client.publish(app.globalData.devicePublish, payload);
        }
    },
    onLoad() {
        const that = this;

        if (app.globalData.client) {
            app.globalData.client.on('message', (topic, payload) => {
                try {
                    const msg = JSON.parse(payload.toString());
                    if (!payload.toString().includes('FB')) return;
                    console.log('收到反馈:', msg);
                    console.log(msg.FB)
                    console.log(that.data.takeoffInProgress);
                    if (msg.FB === '1' && that.data.takeoffInProgress) {
                        wx.hideLoading();
                        wx.showToast({ title: '起飞成功', icon: 'success' });
                        clearTimeout(that.timeout);
                        that.setData({
                            takeoffInProgress: false,
                            isFlying: true
                        });
                    }
                } catch (e) {
                    console.error('解析反馈失败:', e);
                }
            });
        }
    },

    // 起飞/降落控制
    handleTakeoff() {
        if (!app.globalData.client) {
            wx.showToast({ title: '未连接MQTT', icon: 'none' });
            return;
        }
        this.setData({ takeoffInProgress: true });
        wx.showLoading({ title: '正在起飞...' });
        const payload = JSON.stringify({
            TAK: 1
        });
        app.globalData.client.publish(app.globalData.devicePublish, payload); // 根据你的 topic 改
        console.log(payload);
        // 设置超时处理
        this.timeout = setTimeout(() => {
            if (this.data.takeoffInProgress) {
                wx.hideLoading();
                wx.showToast({ title: '起飞失败', icon: 'error' });
                this.setData({ takeoffInProgress: false, isFlying: false });
            }
        }, 5000); // 超时时间 5 秒
    },

    // 紧急停止（模拟断连）
    handleEmergency() {
        wx.showModal({
            title: '警告',
            content: '确认执行紧急停止？',
            success: (res) => {
                if (res.confirm) {
                    // 下发 MQTT 指令
                    if (app.globalData.client) {
                        const payload = JSON.stringify({ STP: 1 });
                        app.globalData.client.publish(app.globalData.devicePublish, payload);
                        console.log(payload)
                    } else {
                        wx.showToast({ title: 'MQTT 未连接', icon: 'none' });
                    }
                    // 本地状态更新
                    this.setData({
                        isFlying: false,
                        status: "紧急停止",
                        battery: 0
                    });
                }
            }
        });
    },

})
