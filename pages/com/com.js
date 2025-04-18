const app = getApp();

Page({
    data: {
        messages: [],
        isDisplaying: false,
        messageCount: 0,
        scrollTop: 0  // 新增属性，用于控制滚动位置
    },

    onLoad() {
        this.messageHandler = (topic, message) => {
            if (!this.data.isDisplaying) return;

            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const milliseconds = String(now.getMilliseconds()).padStart(3, '0'); // 保证是3位
            const timestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`; // 格式：HH:MM:SS.mmm

            let parsedMessage = message.toString();  // 默认显示原始消息

            try {
                // 尝试解析 JSON 格式的消息
                const jsonMessage = JSON.parse(message.toString());
                parsedMessage = JSON.stringify(jsonMessage, null, 2);  // 格式化 JSON 对象
            } catch (error) {
                // 如果解析失败，原样显示消息
                console.log("消息解析失败，使用原始消息:", message.toString());
            }

            const count = this.data.messageCount + 1;

            const newMessage = {
                index: count,
                timestamp: timestamp,
                message: parsedMessage  // 显示解析后的消息
            };

            this.setData({
                messages: [...this.data.messages, newMessage],
                messageCount: count,
                scrollTop: this.data.scrollTop + 1000  // 每次新消息来时自动滚动
            });
        };
    },

    onToggleDisplay(e) {
        const isOn = e.detail.value;

        if (isOn) {
            app.globalData.client.on('message', this.messageHandler);
        } else {
            app.globalData.client.removeListener('message', this.messageHandler);
        }

        this.setData({
            isDisplaying: isOn
        });
    },

    clearMessages() {
        this.setData({
            messages: [],
            messageCount: 0,
            scrollTop: 0  // 清空消息时重置滚动位置
        });
    }
});
