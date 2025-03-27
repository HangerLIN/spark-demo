import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const KMeansVisualizationComponent = () => {
  // Canvas引用
  const canvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  
  // 状态管理
  const [k, setK] = useState(3);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [points, setPoints] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [centers, setCenters] = useState([]);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 画布配置
  const canvasWidth = 400;
  const canvasHeight = 400;
  const pointRadius = 6;
  const centerRadius = 10;
  
  // 颜色配置
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', 
    '#FF33F5', '#F5FF33', '#33FFF5',
    '#FF8033', '#8033FF', '#33FF80'
  ];
  
  // 初始化画布
  useEffect(() => {
    initCanvas();
    drawGrid();
  }, []);
  
  // 当点发生变化时重绘
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      drawGrid();
      drawPoints(ctx, points);
    }
  }, [points]);
  
  // 初始化画布
  const initCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
    
    if (resultCanvasRef.current) {
      const resultCtx = resultCanvasRef.current.getContext('2d');
      resultCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  };
  
  // 绘制网格
  const drawGrid = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制网格
    ctx.beginPath();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    
    // 垂直线
    for (let x = 0; x <= canvasWidth; x += 50) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }
    
    // 水平线
    for (let y = 0; y <= canvasHeight; y += 50) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
    }
    
    ctx.stroke();
  };
  
  // 绘制数据点
  const drawPoints = (ctx, points, predictions = null) => {
    points.forEach((point, index) => {
      const cluster = predictions ? predictions[index].cluster : -1;
      ctx.beginPath();
      ctx.fillStyle = cluster >= 0 ? colors[cluster % colors.length] : '#666';
      ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };
  
  // 绘制聚类中心
  const drawCenters = (ctx, centers) => {
    centers.forEach((center, index) => {
      ctx.beginPath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.arc(center.x, center.y, centerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };
  
  // 在画布上添加点
  const handleCanvasClick = (e) => {
    if (isRunning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    
    // 绘制新点
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = '#666';
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  
  // 重置画布
  const handleReset = () => {
    setPoints([]);
    setCenters([]);
    setError('');
    setResultMessage('');
    initCanvas();
    drawGrid();
  };
  
  // 生成随机数据
  const generateRandomData = () => {
    if (isRunning) return;
    
    const newPoints = [];
    const numClusters = Math.min(4, k);
    const pointsPerCluster = 10;
    
    // 为每个簇生成点
    for (let i = 0; i < numClusters; i++) {
      const centerX = Math.random() * (canvasWidth - 100) + 50;
      const centerY = Math.random() * (canvasHeight - 100) + 50;
      
      for (let j = 0; j < pointsPerCluster; j++) {
        const x = centerX + (Math.random() - 0.5) * 100;
        const y = centerY + (Math.random() - 0.5) * 100;
        
        if (x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight) {
          newPoints.push({ x, y });
        }
      }
    }
    
    setPoints(newPoints);
  };
  
  // 将画布坐标转换为数据点
  const canvasToDataPoints = () => {
    return points.map(point => ({
      feature1: point.x / 40, // 缩放以获得更好的聚类结果
      feature2: point.y / 40
    }));
  };
  
  // 将数据坐标转回画布坐标
  const dataToCanvasPoint = (feature1, feature2) => ({
    x: feature1 * 40,
    y: feature2 * 40
  });
  
  // 调用后端API执行K-means聚类
  const runKMeansClustering = async () => {
    if (points.length < k) {
      setError(`需要至少${k}个数据点才能形成${k}个簇`);
      return;
    }
    
    setIsRunning(true);
    setIsLoading(true);
    setError('');
    
    try {
      const dataPoints = canvasToDataPoints();
      const response = await axios.post('/api/advanced/kmeans', dataPoints);
      
      // 处理响应数据
      const { centers, predictions } = response.data;
      
      // 将中心点转换为画布坐标
      const canvasCenters = centers.map(center => 
        dataToCanvasPoint(center.feature1, center.feature2)
      );
      
      // 将预测结果映射回原始点
      const mappedPredictions = predictions.map((pred, index) => ({
        ...pred,
        x: points[index].x,
        y: points[index].y
      }));
      
      setCenters(canvasCenters);
      
      // 在结果画布上绘制结果
      if (resultCanvasRef.current) {
        const resultCtx = resultCanvasRef.current.getContext('2d');
        resultCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // 绘制网格
        resultCtx.beginPath();
        resultCtx.strokeStyle = '#ddd';
        resultCtx.lineWidth = 0.5;
        
        for (let x = 0; x <= canvasWidth; x += 50) {
          resultCtx.moveTo(x, 0);
          resultCtx.lineTo(x, canvasHeight);
        }
        
        for (let y = 0; y <= canvasHeight; y += 50) {
          resultCtx.moveTo(0, y);
          resultCtx.lineTo(canvasWidth, y);
        }
        
        resultCtx.stroke();
        
        // 绘制带有聚类信息的点
        drawPoints(resultCtx, points, predictions);
        
        // 绘制中心点
        drawCenters(resultCtx, canvasCenters);
      }
      
      setResultMessage(`K-means聚类完成，找到${centers.length}个簇`);
    } catch (error) {
      console.error('K-means聚类错误:', error);
      setError(`聚类过程出错: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsRunning(false);
      setIsLoading(false);
    }
  };
  
  return (
    <Container className="mt-4">
      <h2 className="mb-4">K-means聚类可视化与分析</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {resultMessage && <Alert variant="success">{resultMessage}</Alert>}
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>数据输入区域</Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <canvas
                  ref={canvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  onClick={handleCanvasClick}
                  style={{ border: '1px solid #ddd', cursor: isRunning ? 'default' : 'crosshair' }}
                />
              </div>
              <div className="text-muted mb-3">
                <small>点击上方区域添加数据点，或使用"随机数据"按钮生成数据点</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>聚类结果</Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <canvas
                  ref={resultCanvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  style={{ border: '1px solid #ddd' }}
                />
              </div>
              {centers.length > 0 && (
                <div>
                  <h5>聚类中心:</h5>
                  <ul>
                    {centers.map((center, index) => (
                      <li key={index} style={{ color: colors[index % colors.length] }}>
                        簇 {index + 1}: ({(center.x / 40).toFixed(2)}, {(center.y / 40).toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>参数配置</Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>聚类数量 (K)</Form.Label>
                    <Form.Control
                      type="number"
                      min="2"
                      max="9"
                      value={k}
                      onChange={(e) => setK(parseInt(e.target.value))}
                      disabled={isRunning}
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <div className="d-flex mt-4 justify-content-end">
                    <Button
                      variant="secondary"
                      onClick={generateRandomData}
                      className="me-2"
                      disabled={isRunning}
                    >
                      随机数据
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleReset}
                      className="me-2"
                      disabled={isRunning}
                    >
                      重置
                    </Button>
                    <Button
                      variant="primary"
                      onClick={runKMeansClustering}
                      disabled={isRunning || points.length < 3}
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span className="ms-2">处理中...</span>
                        </>
                      ) : (
                        '开始聚类'
                      )}
                    </Button>
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
            <Card.Header>K-means聚类原理</Card.Header>
            <Card.Body>
              <p>
                K-means是一种常用的聚类算法，目标是将n个数据点划分为k个簇，使得每个数据点属于离它最近的簇中心。
                算法的核心思想是最小化每个点到其所属簇中心的平方和距离。
              </p>
              <h5>算法步骤：</h5>
              <ol>
                <li>随机选择k个点作为初始簇中心</li>
                <li>将每个点分配给最近的簇中心</li>
                <li>重新计算每个簇的中心点（所有点的平均位置）</li>
                <li>重复步骤2和3，直到簇中心不再变化或达到最大迭代次数</li>
              </ol>
              <p>
                在Spark分布式环境中，K-means算法利用RDD并行计算能力，对大数据集进行高效聚类分析。
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default KMeansVisualizationComponent; 