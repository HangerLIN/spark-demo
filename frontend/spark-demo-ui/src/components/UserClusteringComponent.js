import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';

const UserClusteringComponent = () => {
  // 状态管理
  const [k, setK] = useState(4);
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    monthlySpending: '',
    purchaseFrequency: ''
  });
  
  // 图表引用
  const chartRef = useRef(null);
  
  // 颜色配置
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', 
    '#FF33F5', '#F5FF33', '#33FFF5',
    '#FF8033', '#8033FF', '#33FF80'
  ];
  
  // 生成随机用户数据
  const generateRandomUserData = () => {
    const userCount = 50;
    const newData = [];
    
    // 生成4种不同类型的用户
    // 1. 高消费高频率用户
    for (let i = 0; i < userCount * 0.2; i++) {
      newData.push({
        monthlySpending: 800 + Math.random() * 700,
        purchaseFrequency: 8 + Math.random() * 7
      });
    }
    
    // 2. 高消费低频率用户
    for (let i = 0; i < userCount * 0.3; i++) {
      newData.push({
        monthlySpending: 800 + Math.random() * 700,
        purchaseFrequency: 1 + Math.random() * 4
      });
    }
    
    // 3. 低消费高频率用户
    for (let i = 0; i < userCount * 0.3; i++) {
      newData.push({
        monthlySpending: 100 + Math.random() * 500,
        purchaseFrequency: 8 + Math.random() * 7
      });
    }
    
    // 4. 低消费低频率用户
    for (let i = 0; i < userCount * 0.2; i++) {
      newData.push({
        monthlySpending: 100 + Math.random() * 500,
        purchaseFrequency: 1 + Math.random() * 4
      });
    }
    
    // 随机排序
    newData.sort(() => Math.random() - 0.5);
    
    setUserData(newData);
  };
  
  // 添加单个用户数据
  const addUserData = () => {
    if (!formData.monthlySpending || !formData.purchaseFrequency) {
      setError('请输入完整的用户数据');
      return;
    }
    
    const spending = parseFloat(formData.monthlySpending);
    const frequency = parseFloat(formData.purchaseFrequency);
    
    if (isNaN(spending) || isNaN(frequency)) {
      setError('请输入有效的数字');
      return;
    }
    
    setUserData([...userData, {
      monthlySpending: spending,
      purchaseFrequency: frequency
    }]);
    
    setFormData({
      monthlySpending: '',
      purchaseFrequency: ''
    });
    
    setShowForm(false);
    setError('');
  };
  
  // 处理表单数据变化
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 重置数据
  const resetData = () => {
    setUserData([]);
    setResult(null);
    setError('');
  };
  
  // 执行用户聚类分析
  const runUserClustering = async () => {
    if (userData.length < k) {
      setError(`需要至少${k}个用户数据才能形成${k}个簇`);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/advanced/user-clustering', userData);
      setResult(response.data);
      
      // 绘制散点图
      setTimeout(() => {
        if (chartRef.current) {
          drawChart(response.data);
        }
      }, 100);
    } catch (error) {
      console.error('用户聚类错误:', error);
      setError(`聚类过程出错: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 绘制散点图
  const drawChart = (data) => {
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 找出数据范围
    let maxSpending = 0;
    let maxFrequency = 0;
    
    data.predictions.forEach(pred => {
      maxSpending = Math.max(maxSpending, pred.monthlySpending);
      maxFrequency = Math.max(maxFrequency, pred.purchaseFrequency);
    });
    
    // 添加一些边距
    maxSpending = maxSpending * 1.1;
    maxFrequency = maxFrequency * 1.1;
    
    // 绘制坐标轴
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // X轴
    ctx.moveTo(50, height - 50);
    ctx.lineTo(width - 30, height - 50);
    
    // Y轴
    ctx.moveTo(50, height - 50);
    ctx.lineTo(50, 30);
    
    ctx.stroke();
    
    // 绘制刻度和标签
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
    // X轴刻度
    for (let i = 0; i <= 5; i++) {
      const x = 50 + (i * (width - 80) / 5);
      const value = Math.round(i * maxSpending / 5);
      
      ctx.beginPath();
      ctx.moveTo(x, height - 50);
      ctx.lineTo(x, height - 45);
      ctx.stroke();
      
      ctx.fillText(value, x, height - 30);
    }
    
    // X轴标签
    ctx.fillText('月均消费金额', width / 2, height - 10);
    
    // Y轴刻度
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = height - 50 - (i * (height - 80) / 5);
      const value = Math.round(i * maxFrequency / 5);
      
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(45, y);
      ctx.stroke();
      
      ctx.fillText(value, 40, y + 5);
    }
    
    // Y轴标签
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('月均购买次数', 0, 0);
    ctx.restore();
    
    // 绘制数据点
    data.predictions.forEach(pred => {
      const x = 50 + (pred.monthlySpending / maxSpending) * (width - 80);
      const y = height - 50 - (pred.purchaseFrequency / maxFrequency) * (height - 80);
      
      ctx.beginPath();
      ctx.fillStyle = colors[pred.cluster % colors.length];
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    // 绘制聚类中心
    data.centers.forEach((center, index) => {
      const x = 50 + (center.monthlySpending / maxSpending) * (width - 80);
      const y = height - 50 - (center.purchaseFrequency / maxFrequency) * (height - 80);
      
      ctx.beginPath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // 绘制图例
    const legendX = width - 150;
    const legendY = 50;
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('用户簇', legendX, legendY);
    
    data.centers.forEach((center, index) => {
      const y = legendY + 25 + (index * 25);
      
      ctx.beginPath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.arc(legendX + 10, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      const clusterDesc = getUserClusterDescription(index, center);
      ctx.fillText(`簇 ${index + 1}: ${clusterDesc}`, legendX + 25, y + 5);
    });
  };
  
  // 获取用户簇的描述
  const getUserClusterDescription = (index, center) => {
    const spending = center.monthlySpending;
    const frequency = center.purchaseFrequency;
    
    if (spending > 700 && frequency > 7) {
      return '高价值用户';
    } else if (spending > 700 && frequency <= 7) {
      return '高单价用户';
    } else if (spending <= 700 && frequency > 7) {
      return '高频次用户';
    } else {
      return '普通用户';
    }
  };
  
  return (
    <Container className="mt-4">
      <h2 className="mb-4">用户行为聚类分析</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>用户数据</Card.Header>
            <Card.Body>
              {userData.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>月均消费金额</th>
                        <th>月均购买次数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.map((user, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{user.monthlySpending.toFixed(2)}</td>
                          <td>{user.purchaseFrequency.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>暂无用户数据</p>
                  <p>请使用"生成随机数据"按钮或添加用户数据</p>
                </div>
              )}
              
              <div className="mt-3 d-flex justify-content-between">
                <div>
                  <Button
                    variant="primary"
                    onClick={() => setShowForm(!showForm)}
                    className="me-2"
                    disabled={isLoading}
                  >
                    {showForm ? '取消' : '添加用户数据'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={generateRandomUserData}
                    className="me-2"
                    disabled={isLoading}
                  >
                    生成随机数据
                  </Button>
                  <Button
                    variant="danger"
                    onClick={resetData}
                    disabled={isLoading || userData.length === 0}
                  >
                    重置
                  </Button>
                </div>
                <Button
                  variant="success"
                  onClick={runUserClustering}
                  disabled={isLoading || userData.length < k}
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
                    '开始聚类分析'
                  )}
                </Button>
              </div>
              
              {showForm && (
                <div className="mt-3 p-3 border rounded">
                  <h5>添加用户数据</h5>
                  <Form>
                    <Row>
                      <Col md={5}>
                        <Form.Group className="mb-3">
                          <Form.Label>月均消费金额</Form.Label>
                          <Form.Control
                            type="number"
                            name="monthlySpending"
                            value={formData.monthlySpending}
                            onChange={handleFormChange}
                            min="0"
                            step="0.01"
                            placeholder="例：1000.00"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={5}>
                        <Form.Group className="mb-3">
                          <Form.Label>月均购买次数</Form.Label>
                          <Form.Control
                            type="number"
                            name="purchaseFrequency"
                            value={formData.purchaseFrequency}
                            onChange={handleFormChange}
                            min="0"
                            step="0.1"
                            placeholder="例：5.0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex align-items-end">
                        <Button
                          variant="primary"
                          onClick={addUserData}
                          className="mb-3 w-100"
                        >
                          添加
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>参数配置</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>聚类数量 (K)</Form.Label>
                <Form.Control
                  type="number"
                  min="2"
                  max="6"
                  value={k}
                  onChange={(e) => setK(parseInt(e.target.value))}
                  disabled={isLoading}
                />
                <Form.Text className="text-muted">
                  推荐值: 3-4 (对应不同的用户群体)
                </Form.Text>
              </Form.Group>
              
              <div className="mt-3">
                <h6>当前数据:</h6>
                <p>用户数量: {userData.length}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {result && (
        <Row>
          <Col md={12}>
            <Card>
              <Card.Header>聚类结果</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <h5 className="mb-3">用户行为散点图</h5>
                    <div className="text-center mb-4">
                      <canvas
                        ref={chartRef}
                        width={700}
                        height={500}
                        style={{ border: '1px solid #ddd' }}
                      />
                    </div>
                  </Col>
                  <Col md={4}>
                    <h5 className="mb-3">聚类分析</h5>
                    <div className="mb-4">
                      <h6>聚类中心:</h6>
                      <Table bordered size="sm">
                        <thead>
                          <tr>
                            <th>簇</th>
                            <th>月均消费</th>
                            <th>购买频率</th>
                            <th>特征</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.centers.map((center, index) => (
                            <tr key={index}>
                              <td style={{ backgroundColor: colors[index % colors.length] + '40' }}>
                                {index + 1}
                              </td>
                              <td>{center.monthlySpending.toFixed(2)}</td>
                              <td>{center.purchaseFrequency.toFixed(2)}</td>
                              <td>{getUserClusterDescription(index, center)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    
                    <h6>统计信息:</h6>
                    <Table bordered size="sm">
                      <tbody>
                        <tr>
                          <th>用户总数</th>
                          <td>{userData.length}</td>
                        </tr>
                        <tr>
                          <th>簇数量</th>
                          <td>{result.centers.length}</td>
                        </tr>
                        <tr>
                          <th>迭代代价</th>
                          <td>{result.cost?.toFixed(4) || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </Table>
                    
                    <h6 className="mt-4">业务价值分析:</h6>
                    <ul>
                      <li>
                        <strong>高价值用户</strong>: 消费金额高且频率高，建议提供VIP服务与专属优惠
                      </li>
                      <li>
                        <strong>高单价用户</strong>: 消费金额高但频率不高，可提供会员积分与促销活动提高购买频率
                      </li>
                      <li>
                        <strong>高频次用户</strong>: 购买频率高但金额不高，建议推荐高价值商品与提升客单价策略
                      </li>
                      <li>
                        <strong>普通用户</strong>: 消费金额与频率均低，需提供基础促销活动与提高用户粘性
                      </li>
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header>用户行为聚类分析说明</Card.Header>
            <Card.Body>
              <p>
                用户行为聚类分析通过K-means算法将用户按照消费特征分为不同群体，帮助企业识别用户分布特征，制定精准营销策略。
              </p>
              <h5>分析维度：</h5>
              <ul>
                <li><strong>月均消费金额</strong>：用户每月在平台上的平均消费总额</li>
                <li><strong>月均购买次数</strong>：用户每月在平台上的平均购买频率</li>
              </ul>
              <h5>业务价值：</h5>
              <ul>
                <li>识别高价值用户群体，提供差异化服务</li>
                <li>发现潜在高价值用户，制定提升策略</li>
                <li>根据用户群体特征优化产品结构与营销策略</li>
                <li>提高用户留存率与客户终身价值</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserClusteringComponent; 