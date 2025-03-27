import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Statistic, Row, Col, Table, Button, Space, Tag } from 'antd';
import { ReloadOutlined, TableOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const CsvAnalysisComponent = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8088/api/spark/analyze-csv', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      setData(response.data);
      message.success('数据加载成功');
    } catch (error) {
      console.error('CSV分析请求失败:', error);
      let errorMessage = '未知错误';
      if (error.response) {
        errorMessage = `服务器错误 (${error.response.status}): ${error.response.data?.message || '未知服务器错误'}`;
      } else if (error.request) {
        errorMessage = `没有收到服务器响应: ${error.message}`;
      } else {
        errorMessage = `请求错误: ${error.message}`;
      }
      setError(errorMessage);
      message.error('分析失败: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const sampleData = [
    { key: '1', id: 1, name: '张三', age: 28, city: '北京' },
    { key: '2', id: 2, name: '李四', age: 32, city: '上海' },
    { key: '3', id: 3, name: '王五', age: 45, city: '广州' },
    { key: '4', id: 4, name: '赵六', age: 22, city: '深圳' },
    { key: '5', id: 5, name: '钱七', age: 36, city: '杭州' },
  ];
  
  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80,
      align: 'center'
    },
    { 
      title: '姓名', 
      dataIndex: 'name', 
      key: 'name',
      width: 120
    },
    { 
      title: '年龄', 
      dataIndex: 'age', 
      key: 'age',
      width: 100,
      align: 'center'
    },
    { 
      title: '城市', 
      dataIndex: 'city', 
      key: 'city',
      width: 120
    },
  ];

  // 词频统计数据
  const wordFrequencyData = [
    { key: '1', word: '北京', count: 3 },
    { key: '2', word: '上海', count: 2 },
    { key: '3', word: '广州', count: 2 },
    { key: '4', word: '深圳', count: 1 },
    { key: '5', word: '杭州', count: 2 },
  ];

  const wordFrequencyColumns = [
    {
      title: '城市',
      dataIndex: 'word',
      key: 'word',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      align: 'center',
      sorter: (a, b) => b.count - a.count
    }
  ];

  // 城市年龄统计数据
  const cityAgeData = [
    { key: '1', city: '北京', avgAge: 28, minAge: 22, maxAge: 45 },
    { key: '2', city: '上海', avgAge: 32, minAge: 25, maxAge: 38 },
    { key: '3', city: '广州', avgAge: 35, minAge: 28, maxAge: 42 },
    { key: '4', city: '深圳', avgAge: 25, minAge: 22, maxAge: 28 },
    { key: '5', city: '杭州', avgAge: 30, minAge: 26, maxAge: 34 },
  ];

  const cityAgeColumns = [
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: '平均年龄',
      dataIndex: 'avgAge',
      key: 'avgAge',
      width: 120,
      align: 'center',
      render: (text) => <Text strong>{text}岁</Text>
    },
    {
      title: '最小年龄',
      dataIndex: 'minAge',
      key: 'minAge',
      width: 120,
      align: 'center',
      render: (text) => <Text type="secondary">{text}岁</Text>
    },
    {
      title: '最大年龄',
      dataIndex: 'maxAge',
      key: 'maxAge',
      width: 120,
      align: 'center',
      render: (text) => <Text type="secondary">{text}岁</Text>
    }
  ];
  
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>CSV数据分析</Title>
          <Text style={{ fontSize: '16px', color: '#666' }}>使用Spark SQL分析CSV数据集</Text>
        </div>

        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={fetchData} 
          size="large"
          loading={loading}
          style={{ marginBottom: 16 }}
        >
          刷新数据
        </Button>

        {loading ? (
          <Card>
            <Spin tip="加载数据中..." size="large" style={{ display: 'block', padding: '40px 0' }} />
          </Card>
        ) : (
          <>
            <Card 
              title={
                <Space>
                  <TableOutlined />
                  <span style={{ fontSize: '18px' }}>数据示例</span>
                </Space>
              }
              className="result-card"
              bordered={false}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Table 
                dataSource={sampleData} 
                columns={columns}
                pagination={false}
                size="middle"
                style={{ fontSize: '16px' }}
              />
            </Card>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  title={
                    <Space>
                      <BarChartOutlined />
                      <span style={{ fontSize: '18px' }}>城市词频统计</span>
                    </Space>
                  }
                  bordered={false}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Table 
                    dataSource={wordFrequencyData}
                    columns={wordFrequencyColumns}
                    pagination={false}
                    size="middle"
                    style={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  title={
                    <Space>
                      <PieChartOutlined />
                      <span style={{ fontSize: '18px' }}>城市年龄统计</span>
                    </Space>
                  }
                  bordered={false}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Table 
                    dataSource={cityAgeData}
                    columns={cityAgeColumns}
                    pagination={false}
                    size="middle"
                    style={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
            </Row>
            
            {error && (
              <Card 
                title="错误信息" 
                className="result-card" 
                style={{ 
                  marginTop: 16, 
                  backgroundColor: '#fff2f0',
                  borderColor: '#ffccc7'
                }}
              >
                <div style={{ color: '#cf1322', fontSize: '16px' }}>
                  <Text strong>错误详情: </Text>
                  {error}
                </div>
              </Card>
            )}
          </>
        )}
      </Space>
    </div>
  );
};

export default CsvAnalysisComponent; 