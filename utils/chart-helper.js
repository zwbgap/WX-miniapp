var chartHelper = {
  colors: {
    green: '#07c160',
    blue: '#1989fa',
    orange: '#ff976a',
    red: '#ee0a24',
    purple: '#7232dd',
    yellow: '#ffc837',
    teal: '#00bcd4'
  },

  colorPalette: [
    '#07c160', '#1989fa', '#ff976a', '#ee0a24',
    '#7232dd', '#ffc837', '#00bcd4', '#323233'
  ],

  buildLineOption: function(config) {
    return {
      color: config.color ? [config.color] : [this.colors.blue],
      grid: {
        left: 50,
        right: 16,
        top: 30,
        bottom: 30,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: config.xData || [],
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: { color: '#999', fontSize: 10 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
        axisLabel: { color: '#999', fontSize: 10 },
        min: config.yMin || 0
      },
      series: [{
        data: config.yData || [],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: (config.color || this.colors.blue) + '40' },
              { offset: 1, color: (config.color || this.colors.blue) + '05' }
            ]
          }
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: config.color || this.colors.blue,
          borderWidth: 2
        }
      }]
    };
  },

  buildBarOption: function(config) {
    return {
      color: config.colors || [this.colors.blue],
      grid: {
        left: 44,
        right: 16,
        top: 24,
        bottom: 30,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: config.xData || [],
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: { color: '#999', fontSize: 10 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
        axisLabel: { color: '#999', fontSize: 10 }
      },
      series: [{
        data: config.yData || [],
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: config.color || this.colors.blue },
              { offset: 1, color: this.colors.green }
            ]
          }
        },
        label: {
          show: true,
          position: 'top',
          color: '#666',
          fontSize: 10
        }
      }]
    };
  },

  buildPieOption: function(config) {
    var data = config.data || [];
    return {
      color: this.colorPalette,
      series: [{
        type: 'pie',
        radius: config.innerRadius ? [config.innerRadius, '75%'] : ['45%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 10,
          color: '#666'
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          scaleSize: 8
        },
        data: data
      }]
    };
  },

  buildRadarOption: function(config) {
    return {
      color: [this.colors.green],
      radar: {
        center: ['50%', '50%'],
        radius: '60%',
        indicator: config.indicators || [],
        axisName: { color: '#666', fontSize: 11, borderRadius: 3, padding: [3, 5] },
        splitArea: {
          areaStyle: {
            color: ['rgba(7,193,96,0.02)', 'rgba(7,193,96,0.05)']
          }
        },
        splitLine: { lineStyle: { color: 'rgba(7,193,96,0.15)' } },
        axisLine: { lineStyle: { color: 'rgba(7,193,96,0.2)' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: config.values || [],
          name: '健康指标',
          areaStyle: { color: 'rgba(7,193,96,0.2)' },
          lineStyle: { width: 2, color: this.colors.green },
          itemStyle: { color: this.colors.green },
          symbol: 'circle',
          symbolSize: 6
        }]
      }]
    };
  },

  buildDualLineOption: function(config) {
    return {
      color: config.colors || [this.colors.blue, this.colors.orange],
      grid: {
        left: 44,
        right: 16,
        top: 20,
        bottom: 30,
        containLabel: false
      },
      legend: {
        data: config.legend || [],
        bottom: 0,
        textStyle: { fontSize: 10, color: '#999' },
        itemWidth: 12,
        itemHeight: 8
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: config.xData || [],
        axisLine: { show: false },
        axisLabel: { color: '#999', fontSize: 10 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
        axisLabel: { color: '#999', fontSize: 10 }
      },
      series: (config.seriesData || []).map(function(item, i) {
        return {
          name: (config.legend || [])[i] || '',
          data: item,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2 }
        };
      })
    };
  },

  defaultXAxisDays: function(count) {
    var days = [];
    var d = new Date();
    for (var i = count - 1; i >= 0; i--) {
      var t = new Date(d.getTime() - i * 86400000);
      days.push((t.getMonth() + 1) + '/' + t.getDate());
    }
    return days;
  },

  defaultXAxisWeeks: function(count) {
    var weeks = [];
    for (var i = count - 1; i >= 0; i--) {
      weeks.push('第' + (i + 1) + '周');
    }
    return weeks;
  },

  gradientColor: function(ratio) {
    if (ratio >= 0.9) return this.colors.green;
    if (ratio >= 0.7) return this.colors.blue;
    if (ratio >= 0.5) return this.colors.orange;
    return this.colors.red;
  }
};

module.exports = chartHelper;
