import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Button, Table } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const CityAgeStatsComponent = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8088/api/spark/city-age-stats', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setData(response.data);
      message.success('数据加载成功');
    } catch (error) {
      console.error('城市年龄统计请求失败:', error);
      message.error('数据加载失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // 加载组件时自动获取数据
  useEffect(() => {
    fetchData();
  }, []);
  
  // 为图表准备数据
  const chartData = data?.data ? 
    Object.entries(data.data).map(([city, avgAge]) => ({
      city,
      avgAge
    })).sort((a, b) => a.avgAge - b.avgAge) : [];
  
  // 为表格准备数据
  const tableData = chartData.map((item, index) => ({
    key: index,
    city: item.city,
    avgAge: item.avgAge
  }));
  
  // 表格列定义
  const columns = [
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '平均年龄',
      dataIndex: 'avgAge',
      key: 'avgAge',
      sorter: (a, b) => a.avgAge - b.avgAge,
      render: (text) => text.toFixed(1),
    },
  ];
  
  // 找出最大的年龄值来正确缩放图表
  const maxAge = chartData.length > 0 ? Math.max(...chartData.map(d => d.avgAge)) : 50;
  
  return (
    <div>
      <Title level={3}>城市年龄统计</Title>
      <Text>按城市分组统计人口平均年龄</Text>
      
      <Button 
        type="primary" 
        onClick={fetchData} 
        style={{ marginTop: 16, marginBottom: 16 }}
        loading={loading}
      >
        刷新数据
      </Button>
      
      {loading ? (
        <Spin tip="加载数据中..." style={{ display: 'block', marginTop: 20 }} />
      ) : (
        data && (
          <>
            <Card title="城市平均年龄图表" className="result-card">
              <div className="chart-container" style={{margin: '20px 0', maxHeight: '500px', overflow: 'auto'}}>
                {chartData.length > 0 && (
                  <div style={{padding: '20px'}}>
                    {chartData.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex', 
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}>
                        <div style={{width: '100px', textAlign: 'right', paddingRight: '10px'}}>
                          {item.city}
                        </div>
                        <div style={{
                          backgroundColor: '#1890ff', 
                          width: `${(item.avgAge / maxAge) * 70}%`, 
                          minWidth: '50px',
                          height: '30px',
                          display: 'flex', 
                          alignItems: 'center', 
                          color: 'white',
                          paddingLeft: '10px',
                          borderRadius: '4px'
                        }}>
                          {item.avgAge.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
            
            <Card title="城市平均年龄数据" className="result-card">
              <div style={{ marginBottom: 16 }}>
                <Text strong>总城市数: </Text>
                <Text>{data.totalCities}</Text>
              </div>
              
              <Table 
                dataSource={tableData} 
                columns={columns}
                pagination={false}
                size="middle"
              />
            </Card>
          </>
        )
      )}
    </div>
  );
};

export default CityAgeStatsComponent; 