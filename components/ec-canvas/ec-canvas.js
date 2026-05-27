var ECharts = null;

function loadECharts() {
  if (ECharts) return Promise.resolve(ECharts);
  return new Promise(function(resolve, reject) {
    try {
      ECharts = require('../../libs/echarts.min');
      resolve(ECharts);
    } catch (e) {
      console.warn('ECharts 未安装，使用 Canvas 2D 降级渲染');
      resolve(null);
    }
  });
}

function initCanvas(canvas, width, height, dpr) {
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

function renderFallbackLineChart(ctx, w, h, options) {
  if (!options || !options.series || !options.xAxis) return;
  var xData = options.xAxis.data || options.xAxis[0].data || [];
  var series = options.series[0];
  var yData = series.data || [];
  if (xData.length === 0 || yData.length === 0) return;

  var pad = { top: 20, right: 16, bottom: 36, left: 44 };
  var chartW = w - pad.left - pad.right;
  var chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  var maxY = Math.max.apply(null, yData) * 1.15 || 10;
  var getY = function(val) { return pad.top + chartH - (val / maxY) * chartH; };
  var stepX = xData.length > 1 ? chartW / (xData.length - 1) : chartW / 2;

  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 0.5;
  for (var i = 0; i <= 4; i++) {
    var val = (maxY / 4) * i;
    var y = getY(val);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), pad.left - 6, y + 3);
  }

  var colors = (options.color || ['#1989fa'])[0];

  var gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  gradient.addColorStop(0, colors.replace(')', ',0.25)').replace('rgb', 'rgba'));
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.beginPath();
  for (var i = 0; i < yData.length; i++) {
    var x = pad.left + i * stepX;
    var y = getY(yData[i]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  var lastX = pad.left + (yData.length - 1) * stepX;
  ctx.lineTo(lastX, pad.top + chartH);
  ctx.lineTo(pad.left, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = colors;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (var i = 0; i < yData.length; i++) {
    var x = pad.left + i * stepX;
    var y = getY(yData[i]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (var i = 0; i < yData.length; i++) {
    var x = pad.left + i * stepX;
    var y = getY(yData[i]);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = colors;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  xData.forEach(function(label, i) {
    var x = pad.left + i * stepX;
    ctx.fillStyle = '#999';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(label).substring(5), x, h - 6);
  });
}

function renderFallbackBarChart(ctx, w, h, options) {
  if (!options || !options.series || !options.xAxis) return;
  var xData = options.xAxis.data || options.xAxis[0].data || [];
  var series = options.series[0];
  var yData = series.data || [];
  if (xData.length === 0 || yData.length === 0) return;

  var pad = { top: 20, right: 16, bottom: 40, left: 44 };
  var chartW = w - pad.left - pad.right;
  var chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  var maxY = Math.max.apply(null, yData) * 1.2 || 10;
  var getY = function(val) { return pad.top + chartH - (val / maxY) * chartH; };
  var totalBars = xData.length;
  var barWidth = Math.min(chartW / totalBars * 0.6, 40);
  var gap = chartW / totalBars;

  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 0.5;
  for (var i = 0; i <= 4; i++) {
    var val = (maxY / 4) * i;
    var y = getY(val);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), pad.left - 6, y + 3);
  }

  yData.forEach(function(val, i) {
    var x = pad.left + i * gap + (gap - barWidth) / 2;
    var barH = (val / maxY) * chartH;
    var y = pad.top + chartH - barH;

    var gradient = ctx.createLinearGradient(x, y, x, y + barH);
    gradient.addColorStop(0, '#1989fa');
    gradient.addColorStop(1, '#07c160');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val, x + barWidth / 2, y - 6);
  });

  xData.forEach(function(label, i) {
    var x = pad.left + i * gap + gap / 2;
    ctx.fillStyle = '#999';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(label).substring(5), x, h - 6);
  });
}

function renderFallbackPieChart(ctx, w, h, options) {
  if (!options || !options.series) return;
  var data = options.series[0].data || [];
  if (data.length === 0) return;

  var cx = w / 2;
  var cy = h / 2;
  var outerR = Math.min(w, h) / 2 - 40;
  var innerR = outerR * 0.55;

  ctx.clearRect(0, 0, w, h);

  var total = 0;
  data.forEach(function(item) { total += item.value || 0; });
  if (total === 0) return;

  var colors = ['#07c160', '#1989fa', '#ff976a', '#ee0a24', '#7232dd', '#ffc837', '#323233'];
  var startAngle = -Math.PI / 2;

  data.forEach(function(item, i) {
    var sliceAngle = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    var midAngle = startAngle + sliceAngle / 2;
    var labelR = outerR + 32;
    var lx = cx + Math.cos(midAngle) * labelR;
    var ly = cy + Math.sin(midAngle) * labelR;
    ctx.fillStyle = '#333';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name || '', lx, ly);

    startAngle += sliceAngle;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 6);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#999';
  ctx.fillText('总计', cx, cy + 12);
}

Component({
  properties: {
    chartType: {
      type: String,
      value: 'line'
    },
    options: {
      type: Object,
      value: null,
      observer: 'onOptionsChange'
    },
    canvasHeight: {
      type: Number,
      value: 400
    },
    loading: {
      type: Boolean,
      value: false
    }
  },

  data: {
    echartsReady: false,
    canvasId: 'ec-canvas-' + Math.random().toString(36).substring(2, 8)
  },

  lifetimes: {
    attached() {
      this.initECharts();
    },
    detached() {
      if (this._chart) {
        this._chart.dispose();
        this._chart = null;
      }
    }
  },

  methods: {
    initECharts() {
      var that = this;
      loadECharts().then(function(ec) {
        if (ec) {
          that.setData({ echartsReady: true });
          that.renderWithECharts(ec);
        } else {
          that.renderFallback();
        }
      });
    },

    onOptionsChange(newVal) {
      if (!newVal) return;
      if (this.data.echartsReady) {
        this.renderWithECharts(ECharts);
      } else {
        this.renderFallback();
      }
    },

    renderWithECharts(ec) {
      var that = this;
      var query = this.createSelectorQuery();
      query.select('#' + this.data.canvasId)
        .fields({ node: true, size: true })
        .exec(function(res) {
          if (!res || !res[0]) return;
          var canvas = res[0].node;
          var width = res[0].width;
          var height = res[0].height;

          if (!that._chart) {
            that._chart = ec.init(canvas, null, {
              width: width,
              height: height,
              devicePixelRatio: wx.getSystemInfoSync().pixelRatio
            });
          }

          if (that.data.options) {
            that._chart.setOption(that.data.options, true);
          }
        });
    },

    renderFallback() {
      var that = this;
      var query = this.createSelectorQuery();
      query.select('#' + this.data.canvasId)
        .fields({ node: true, size: true })
        .exec(function(res) {
          if (!res || !res[0]) return;
          var canvas = res[0].node;
          var width = res[0].width;
          var height = res[0].height;
          var dpr = wx.getSystemInfoSync().pixelRatio;

          var ctx = initCanvas(canvas, width, height, dpr);

          switch (that.data.chartType) {
            case 'bar':
              renderFallbackBarChart(ctx, width, height, that.data.options);
              break;
            case 'pie':
              renderFallbackPieChart(ctx, width, height, that.data.options);
              break;
            default:
              renderFallbackLineChart(ctx, width, height, that.data.options);
              break;
          }
        });
    },

    refresh() {
      if (this.data.options) {
        this.onOptionsChange(this.data.options);
      }
    }
  }
});
