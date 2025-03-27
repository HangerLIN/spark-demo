import React, { useState } from 'react';
import { Input, Button, Card, Table, Typography, message, Spin } from 'antd';
import axios from 'axios';

const { TextArea } = Input;
const { Title, Text } = Typography;

const WordCountComponent = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      message.error('请输入要分析的文本');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8088/api/spark/wordcount', text, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      setResult(response.data);
      message.success('分析成功');
    } catch (error) {
      console.error('词频统计请求失败:', error);
      message.error('分析失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 准备表格数据
  const tableData = result?.result ? 
    Object.entries(result.result).map(([word, count], index) => ({
      key: index,
      word,
      count
    })) : [];

  // 表格列定义
  const columns = [
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div>
      <Title level={3}>词频统计</Title>
      <Text>输入文本，使用Spark进行词频统计分析</Text>
      
      <div style={{ marginTop: 16 }}>
        <TextArea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入要分析的文本，例如：这是一段测试文本 用于测试Spark词频统计功能 这是一段文本 Spark真的很强大"
        />
      </div>
      
      <Button 
        type="primary" 
        onClick={handleSubmit} 
        style={{ marginTop: 16 }}
        loading={loading}
      >
        分析
      </Button>
      
      {loading && <Spin tip="分析中..." style={{ display: 'block', marginTop: 20 }} />}
      
      {result && (
        <Card title="分析结果" className="result-card">
          <div style={{ marginBottom: 16 }}>
            <Text strong>总词数: </Text>
            <Text>{result.totalWords}</Text>
            <br />
            <Text strong>不同词数: </Text>
            <Text>{result.uniqueWords}</Text>
          </div>
          
          <Table 
            dataSource={tableData} 
            columns={columns} 
            pagination={false}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
};

export default WordCountComponent; 