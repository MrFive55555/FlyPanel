import * as echarts from '../../ec-canvas/echarts';

let chart = null;

Page({
  data: {
    ec: {
      onInit: function (canvas, width, height) {
        chart = echarts.init(canvas, null, {
          width: width,
          height: height
        });
        canvas.setChart(chart);

        const option = {
          title: {
            text: 'Pitch & Roll 实时曲线'
          },
          legend: {
            data: ['Pitch', 'Roll']
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: []
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: 'Pitch',
              type: 'line',
              data: []
            },
            {
              name: 'Roll',
              type: 'line',
              data: []
            }
          ]
        };
        chart.setOption(option);
        return chart;
      }
    }
  },

  onLoad() {
    if (!app.globalData.client) {
      console.error('MQTT app.globalData.client 不存在！');
      return;
    }

    // const topic = 'your/topic'; // 替换成实际 topic
    // app.globalData.client.subscribe(topic);

    app.globalData.client.on('message', (topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        const pitch = msg.pitch;
        const roll = msg.roll;
        this.updateChart(pitch, roll);
      } catch (e) {
        console.error('解析 MQTT 消息失败', e);
      }
    });
  },

  updateChart(pitch, roll) {
    const option = chart.getOption();
    const time = new Date().toLocaleTimeString();

    option.xAxis[0].data.push(time);
    option.series[0].data.push(pitch);
    option.series[1].data.push(roll);

    if (option.xAxis[0].data.length > 50) {
      option.xAxis[0].data.shift();
      option.series[0].data.shift();
      option.series[1].data.shift();
    }

    chart.setOption(option);
  }
});
