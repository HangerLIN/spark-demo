import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';

const StreamingAnalysisComponent = () => {
  // 状态管理
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState([]);
  const [isMockData, setIsMockData] = useState(false); // 添加模拟数据状态
  const [lastUpdateTime, setLastUpdateTime] = useState(null); // 添加最后更新时间
  const [isLoading, setIsLoading] = useState(false); // 添加加载状态
  const [stats, setStats] = useState({
    totalUsers: 0,
    avgSpending: 0,
    totalTransactions: 0,
    anomalyCount: 0
  });
  const [error, setError] = useState('');
  const [timeWindow, setTimeWindow] = useState(60); // 默认60秒窗口
  const [threshold, setThreshold] = useState(1000); // 异常检测阈值
  
  // 图表引用
  const spendingChartRef = useRef(null);
  const frequencyChartRef = useRef(null);
  
  // 颜色配置
  const colors = {
    normal: '#33FF57',
    anomaly: '#FF5733',
    background: '#f8f9fa'
  };
  
  // 启动流处理
  const startStreaming = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`/api/advanced/start-streaming?timeWindow=${timeWindow}&threshold=${threshold}`);
      setIsStreaming(true);
      setLastUpdateTime(new Date());
      
      // 启动轮询
      startPolling();
    } catch (error) {
      console.error('启动流处理错误:', error);
      
      // 生成模拟数据作为降级方案
      const mockData = generateMockStreamingData();
      updateStats(mockData);
      updateCharts(mockData);
      setIsMockData(true);
      setLastUpdateTime(new Date()); // 更新时间
      
      // 设置更友好的错误信息
      if (error.message && error.message.includes('Network Error')) {
        setError('启动流处理暂时不可用，已切换到演示模式。原因：网络连接问题，请检查后端服务是否正常运行。');
      } else if (error.response?.data?.error && error.response.data.error.includes('SparkContext')) {
        setError('启动流处理服务时出现Spark配置问题，已切换到演示模式。这可能是由于Spark上下文冲突引起的，请稍后再试。');
      } else {
        setError(`启动流处理失败，已切换到演示模式。原因：${error.response?.data?.error || error.message}`);
      }
      
      // 允许用户继续使用界面，但使用模拟数据
      setIsStreaming(true);
      setIsLoading(false); // 结束加载状态
    }
  };
  
  // 生成模拟数据
  const generateMockStreamingData = () => {
    // 生成模拟的基础统计数据
    const mockStats = {
      totalUsers: Math.floor(Math.random() * 20) + 5,
      avgSpending: Math.floor(Math.random() * 500) + 100,
      totalTransactions: Math.floor(Math.random() * 100) + 20,
      anomalyCount: Math.floor(Math.random() * 5),
      spendingTrend: [],
      frequencyTrend: []
    };
    
    // 生成模拟的趋势数据
    for (let i = 0; i < 20; i++) {
      const value = Math.floor(Math.random() * 1000) + 100;
      const isAnomaly = Math.random() > 0.9; // 10% 的概率是异常值
      
      mockStats.spendingTrend.push({
        value,
        isAnomaly
      });
      
      mockStats.frequencyTrend.push({
        value: Math.floor(Math.random() * 10) + 1,
        isAnomaly
      });
    }
    
    return mockStats;
  };
  
  // 停止流处理
  const stopStreaming = async () => {
    try {
      setIsLoading(true);
      await axios.post('/api/advanced/stop-streaming');
      setIsStreaming(false);
      setIsMockData(false);
      setIsLoading(false);
    } catch (error) {
      console.error('停止流处理错误:', error);
      setError(`停止流处理失败: ${error.response?.data?.error || error.message}`);
      
      // 无论如何都将状态设置为已停止，以便用户可以再次尝试启动
      setIsStreaming(false);
      setIsLoading(false);
    }
  };
  
  // 轮询获取实时数据
  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      if (!isStreaming) {
        clearInterval(pollInterval);
        return;
      }
      
      setIsLoading(true); // 开始加载
      
      try {
        const response = await axios.get('/api/advanced/streaming-stats');
        
        // 检查服务状态
        if (response.data.status === "未运行") {
          // 流处理已停止，更新UI状态
          setIsStreaming(false);
          setError("流处理服务已停止，请重新启动");
          clearInterval(pollInterval);
          setIsLoading(false);
          return;
        }
        
        updateStats(response.data);
        updateCharts(response.data);
        setIsMockData(false);
        setLastUpdateTime(new Date()); // 更新时间
        setError(null); // 清除之前的错误
        setIsLoading(false); // 结束加载
      } catch (error) {
        console.error('获取流数据错误:', error);
        
        // 在轮询失败时也提供模拟数据
        if (!isMockData) { // 仅当当前不是模拟数据时才显示错误
          if (error.message && error.message.includes('Network Error')) {
            setError('网络连接问题，已切换到演示模式。请检查后端服务是否正常运行。');
          } else {
            setError(`获取数据失败，已切换到演示模式。原因：${error.response?.data?.error || error.message}`);
          }
        }
        
        const mockData = generateMockStreamingData();
        updateStats(mockData);
        updateCharts(mockData);
        setIsMockData(true);
        setLastUpdateTime(new Date()); // 更新时间
        setIsLoading(false); // 结束加载
      }
    }, 2000); // 每2秒更新一次
    
    return () => clearInterval(pollInterval);
  };
  
  // 更新统计信息
  const updateStats = (data) => {
    setStats({
      totalUsers: data.totalUsers,
      avgSpending: data.avgSpending,
      totalTransactions: data.totalTransactions,
      anomalyCount: data.anomalyCount
    });
  };
  
  // 更新图表
  const updateCharts = (data) => {
    // 更新消费金额趋势图
    if (spendingChartRef.current) {
      const ctx = spendingChartRef.current.getContext('2d');
      drawSpendingChart(ctx, data.spendingTrend);
    }
    
    // 更新购买频率趋势图
    if (frequencyChartRef.current) {
      const ctx = frequencyChartRef.current.getContext('2d');
      drawFrequencyChart(ctx, data.frequencyTrend);
    }
  };
  
  // 绘制消费金额趋势图
  const drawSpendingChart = (ctx, data) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制数据线
    ctx.beginPath();
    ctx.strokeStyle = colors.normal;
    ctx.lineWidth = 2;
    
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (point.value / 2000) * height; // 假设最大值为2000
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // 绘制异常点
      if (point.isAnomaly) {
        ctx.beginPath();
        ctx.fillStyle = colors.anomaly;
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.stroke();
  };
  
  // 绘制购买频率趋势图
  const drawFrequencyChart = (ctx, data) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制数据线
    ctx.beginPath();
    ctx.strokeStyle = colors.normal;
    ctx.lineWidth = 2;
    
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (point.value / 20) * height; // 假设最大值为20
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // 绘制异常点
      if (point.isAnomaly) {
        ctx.beginPath();
        ctx.fillStyle = colors.anomaly;
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.stroke();
  };
  
  // 格式化时间
  const formatTime = (date) => {
    if (!date) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };
  
  // 组件卸载时停止流处理
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming();
      }
    };
  }, []);
  
  return (
    <Container className="mt-4">
      <h2 className="mb-4">实时用户行为分析</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {isMockData && !error && <Alert variant="warning">当前显示的是模拟数据，不是实际系统数据。</Alert>}
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              实时数据趋势
              {isMockData && <span className="badge bg-warning text-dark ms-2">模拟数据</span>}
              {!isMockData && isStreaming && <span className="badge bg-success ms-2">实时数据</span>}
              {isLoading && <Spinner animation="border" size="sm" className="ms-2" />}
              {lastUpdateTime && <small className="text-muted ms-2">上次更新: {formatTime(lastUpdateTime)}</small>}
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>消费金额趋势</h6>
                  <canvas
                    ref={spendingChartRef}
                    width={400}
                    height={200}
                    style={{ border: '1px solid #ddd' }}
                  />
                </Col>
                <Col md={6}>
                  <h6>购买频率趋势</h6>
                  <canvas
                    ref={frequencyChartRef}
                    width={400}
                    height={200}
                    style={{ border: '1px solid #ddd' }}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>参数配置</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>时间窗口 (秒)</Form.Label>
                <Form.Control
                  type="number"
                  min="10"
                  max="300"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(parseInt(e.target.value))}
                  disabled={isStreaming}
                />
                <Form.Text className="text-muted">
                  用于计算实时统计指标的时间窗口大小
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>异常检测阈值</Form.Label>
                <Form.Control
                  type="number"
                  min="100"
                  max="5000"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  disabled={isStreaming}
                />
                <Form.Text className="text-muted">
                  超过此阈值的交易将被标记为异常
                </Form.Text>
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button
                  variant={isStreaming ? "danger" : "primary"}
                  onClick={isStreaming ? stopStreaming : startStreaming}
                >
                  {isStreaming ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">停止流处理</span>
                    </>
                  ) : (
                    '启动流处理'
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>实时统计指标</Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h4>{stats.totalUsers}</h4>
                    <p className="text-muted">活跃用户数</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h4>¥{stats.avgSpending.toFixed(2)}</h4>
                    <p className="text-muted">平均消费金额</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h4>{stats.totalTransactions}</h4>
                    <p className="text-muted">总交易数</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h4>{stats.anomalyCount}</h4>
                    <p className="text-muted">异常交易数</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header>实时流处理说明</Card.Header>
            <Card.Body>
              <p>
                实时流处理分析使用Spark Streaming技术，对用户行为数据进行实时处理和分析。
                系统可以实时检测异常交易，计算关键指标，并生成趋势图表。
              </p>
              <h5>主要功能：</h5>
              <ul>
                <li>实时计算用户行为统计指标</li>
                <li>异常交易实时检测与预警</li>
                <li>消费金额与购买频率趋势分析</li>
                <li>可配置的时间窗口与异常阈值</li>
              </ul>
              <h5>技术特点：</h5>
              <ul>
                <li>使用Spark Streaming进行实时数据处理</li>
                <li>支持滑动时间窗口计算</li>
                <li>实时异常检测算法</li>
                <li>WebSocket实时数据推送</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StreamingAnalysisComponent; 