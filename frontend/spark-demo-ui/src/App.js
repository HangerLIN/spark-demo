import React from 'react';
import { Layout, Tabs } from 'antd';
import WordCountComponent from './components/WordCountComponent';
import CsvAnalysisComponent from './components/CsvAnalysisComponent';
import CityAgeStatsComponent from './components/CityAgeStatsComponent';
import KMeansVisualizationComponent from './components/KMeansVisualizationComponent';
import UserClusteringComponent from './components/UserClusteringComponent';
import StreamingAnalysisComponent from './components/StreamingAnalysisComponent';
import GraphAnalysisComponent from './components/GraphAnalysisComponent';

const { Header, Content } = Layout;

function App() {
  const items = [
    {
      key: '1',
      label: '词频统计',
      children: <WordCountComponent />,
    },
    {
      key: '2',
      label: 'CSV数据分析',
      children: <CsvAnalysisComponent />,
    },
    {
      key: '3',
      label: '城市年龄统计',
      children: <CityAgeStatsComponent />,
    },
    {
      key: '4',
      label: 'K-means聚类可视化',
      children: <KMeansVisualizationComponent />,
    },
    {
      key: '5',
      label: '用户行为聚类',
      children: <UserClusteringComponent />,
    },
    {
      key: '6',
      label: '实时流处理分析',
      children: <StreamingAnalysisComponent />,
    },
    {
      key: '7',
      label: '图计算分析',
      children: <GraphAnalysisComponent />,
    },
  ];

  return (
    <Layout className="layout">
      <Header style={{ color: 'white', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
        Spark大数据分析示例
      </Header>
      <Content className="container">
        <Tabs defaultActiveKey="7" items={items} />
      </Content>
    </Layout>
  );
}

export default App; 