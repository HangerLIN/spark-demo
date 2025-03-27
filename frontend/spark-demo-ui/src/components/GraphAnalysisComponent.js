import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab, Badge } from 'react-bootstrap';
import axios from 'axios';
import * as d3 from 'd3';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 配置axios的基础URL
axios.defaults.baseURL = 'http://localhost:8088';

const GraphAnalysisComponent = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('user-network');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // 图表引用
  const graphRef = useRef(null);
  
  // 颜色配置
  const colors = {
    user: '#4CAF50',
    product: '#2196F3',
    community: '#FFC107',
    edge: {
      '好友': '#FF5722',
      '同事': '#607D8B',
      '同类': '#3F51B5',
      '跨类': '#9C27B0'
    },
    node: {
      'VIP': '#FF5722',
      '普通': '#8BC34A',
      '电子产品': '#03A9F4',
      '服装': '#9C27B0',
      '食品': '#FF9800',
      '社交圈': '#E91E63',
      '工作圈': '#607D8B',
      '核心圈-VIP': '#F44336',
      '外围圈-VIP': '#9E9E9E',
      'Community1': '#E91E63',
      'Community2': '#4CAF50'
    }
  };

  // 高亮代码片段
  const codeSnippets = {
    userNetwork: `// 用户关系网络分析
public Map<String, Object> analyzeUserNetwork() {
  try {
    logger.info("开始用户关系网络分析");
    
    // 创建用户顶点数据
    List<Tuple2<Object, UserVertexData>> vertices = Arrays.asList(
      new Tuple2<>(1L, new UserVertexData("用户A", "VIP", 1000.0)),
      new Tuple2<>(2L, new UserVertexData("用户B", "普通", 500.0)),
      // ...更多用户数据
    );

    // 创建关系边数据
    List<Edge<EdgeData>> edges = Arrays.asList(
      new Edge<>(1L, 2L, new EdgeData("好友", 5.0)),
      new Edge<>(2L, 3L, new EdgeData("同事", 4.0)),
      // ...更多关系数据
    );

    // 创建用户关系图
    Graph<UserVertexData, EdgeData> graph = Graph.apply(
      jsc.parallelize(vertices).rdd(),
      jsc.parallelize(edges).rdd(),
      new UserVertexData("", "", 0.0),
      StorageLevel.MEMORY_ONLY(),
      StorageLevel.MEMORY_ONLY(),
      vertexTag,
      edgeTag
    );

    // 计算用户影响力（基于PageRank）
    Graph<Double, EdgeData> influenceGraph = 
      (Graph<Double, EdgeData>) graph.ops().staticPageRank(20, 0.0);

    // 计算用户社区（基于连通分量）
    Graph<Object, EdgeData> communityGraph = 
      (Graph<Object, EdgeData>) graph.ops().connectedComponents(20);
    
    // ...更多计算和结果处理
  } catch (Exception e) {
    logger.error("用户关系网络分析失败", e);
    throw new RuntimeException("分析失败: " + e.getMessage());
  }
}`,
    productRecommendations: `// 商品推荐分析
public Map<String, Object> analyzeProductRecommendations() {
  try {
    logger.info("开始商品推荐分析");
    
    // 创建商品顶点数据
    List<Tuple2<Object, ProductVertexData>> vertices = Arrays.asList(
      new Tuple2<>(1L, new ProductVertexData("商品A", "电子产品", 999.0)),
      new Tuple2<>(2L, new ProductVertexData("商品B", "电子产品", 1999.0)),
      // ...更多商品数据
    );

    // 创建商品关联边数据
    List<Edge<EdgeData>> edges = Arrays.asList(
      new Edge<>(1L, 2L, new EdgeData("同类", 0.8)),
      new Edge<>(2L, 3L, new EdgeData("跨类", 0.3)),
      // ...更多关联数据
    );

    // 创建商品关系图
    Graph<ProductVertexData, EdgeData> graph = Graph.apply(
      jsc.parallelize(vertices).rdd(),
      jsc.parallelize(edges).rdd(),
      new ProductVertexData("", "", 0.0),
      StorageLevel.MEMORY_ONLY(),
      StorageLevel.MEMORY_ONLY(),
      vertexTag,
      edgeTag
    );

    // 计算商品相似度（基于共同购买和价格差异）
    Graph<ProductVertexData, Double> similarityGraph = graph.mapEdges(
      new scala.runtime.AbstractFunction1<Edge<EdgeData>, Double>() {
        @Override
        public Double apply(Edge<EdgeData> edge) {
          ProductVertexData src = graph.vertices().toJavaRDD()
            .filter(v -> v._1().equals(edge.srcId()))
            .map(v -> v._2())
            .first();
          ProductVertexData dst = graph.vertices().toJavaRDD()
            .filter(v -> v._1().equals(edge.dstId()))
            .map(v -> v._2())
            .first();
          
          double priceDiff = Math.abs(src.price - dst.price) / Math.max(src.price, dst.price);
          double relationWeight = edge.attr().weight;
          return (1 - priceDiff) * relationWeight;
        }
      },
      scala.reflect.ClassTag$.MODULE$.apply(Double.class)
    );
    
    // ...更多计算和结果处理
  } catch (Exception e) {
    logger.error("商品推荐分析失败", e);
    throw new RuntimeException("分析失败: " + e.getMessage());
  }
}`,
    communities: `// 社区发现分析
public Map<String, Object> analyzeCommunities() {
  try {
    logger.info("开始社区发现分析");
    
    // 创建用户顶点数据
    List<Tuple2<Object, UserVertexData>> vertices = Arrays.asList(
      new Tuple2<>(1L, new UserVertexData("用户A", "VIP", 1000.0)),
      new Tuple2<>(2L, new UserVertexData("用户B", "普通", 500.0)),
      // ...更多用户数据
    );

    // 创建用户关系边数据
    List<Edge<EdgeData>> edges = Arrays.asList(
      new Edge<>(1L, 2L, new EdgeData("好友", 5.0)),
      new Edge<>(2L, 3L, new EdgeData("同事", 4.0)),
      // ...更多关系数据
    );

    // 创建用户关系图
    Graph<UserVertexData, EdgeData> graph = Graph.apply(
      jsc.parallelize(vertices).rdd(),
      jsc.parallelize(edges).rdd(),
      new UserVertexData("", "", 0.0),
      StorageLevel.MEMORY_ONLY(),
      StorageLevel.MEMORY_ONLY(),
      vertexTag,
      edgeTag
    );

    // 使用连通分量算法发现社区
    Graph<Object, EdgeData> communityGraph = 
      (Graph<Object, EdgeData>) graph.ops().connectedComponents(20);

    // 计算社区特征
    ClassTag<CommunityData> communityDataTag = 
      scala.reflect.ClassTag$.MODULE$.apply(CommunityData.class);
    Graph<CommunityData, EdgeData> enrichedGraph = communityGraph.mapVertices(
      new scala.runtime.AbstractFunction2<Object, Object, CommunityData>() {
        @Override
        public CommunityData apply(Object id, Object community) {
          UserVertexData userData = graph.vertices().toJavaRDD()
            .filter(v -> v._1().equals(id))
            .map(v -> v._2())
            .first();
          return new CommunityData(userData.name, community.toString(), 
                                   userData.level, userData.spending);
        }
      },
      communityDataTag
    );
    
    // ...更多计算和结果处理
  } catch (Exception e) {
    logger.error("社区发现分析失败", e);
    throw new RuntimeException("分析失败: " + e.getMessage());
  }
}`
  };
  
  // 用户关系网络分析
  const analyzeUserNetwork = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/advanced/user-network');
      setGraphData(response.data);
      
      // 提取分析结果数据
      const analysisData = {
        title: "用户关系网络分析结果",
        description: "以下是基于用户关系网络的分析结果，展示了用户影响力和连接度：",
        items: []
      };
      
      if (response.data.nodes) {
        response.data.nodes.forEach(node => {
          analysisData.items.push({
            name: node.name || node.id,
            value: node.size,
            type: "影响力指数",
            description: `该用户在网络中的影响力为 ${node.size}，表示其在社交网络中的重要性。`
          });
        });
      }
      
      setAnalysisResult(analysisData);
      drawGraph(response.data, 'user');
    } catch (error) {
      setError(`用户关系网络分析失败: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 商品关联推荐
  const analyzeProductRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/advanced/product-recommendations');
      setGraphData(response.data);
      
      // 建立产品ID到名称的映射
      const productMap = {};
      if (response.data.nodes) {
        response.data.nodes.forEach(node => {
          productMap[node.id] = node.name || node.id;
        });
      }
      
      // 提取分析结果数据
      const analysisData = {
        title: "商品关联推荐分析结果",
        description: "以下是基于商品关系网络的分析结果，展示了商品间的相似度：",
        items: []
      };
      
      if (response.data.links) {
        response.data.links.forEach(link => {
          const sourceId = link.source;
          const targetId = link.target;
          const sourceName = productMap[sourceId] || sourceId;
          const targetName = productMap[targetId] || targetId;
          
          analysisData.items.push({
            name: `${sourceName} → ${targetName}`,
            value: typeof link.value === 'number' ? link.value.toFixed(2) : link.value,
            type: "相似度",
            description: `这两个商品的相似度为 ${typeof link.value === 'number' ? link.value.toFixed(2) : link.value}，数值越高表示它们越相关。`
          });
        });
      }
      
      setAnalysisResult(analysisData);
      drawGraph(response.data, 'product');
    } catch (error) {
      console.error("商品关联推荐分析失败:", error);
      setError(`商品关联推荐分析失败: ${error.response?.data?.error || error.message}`);
      
      // 创建示例数据进行展示
      const mockData = generateMockProductData();
      setGraphData(mockData);
      
      // 提取分析结果数据
      const fallbackData = {
        title: "商品关联推荐示例数据",
        description: "由于API请求失败，以下是示例数据，仅供参考。实际数据可能有所不同。",
        items: []
      };
      
      // 建立产品ID到名称的映射
      const productMap = {};
      mockData.nodes.forEach(node => {
        productMap[node.id] = node.name;
      });
      
      // 生成示例项目
      mockData.links.forEach(link => {
        const sourceName = productMap[link.source];
        const targetName = productMap[link.target];
        
        fallbackData.items.push({
          name: `${sourceName} → ${targetName}`,
          value: link.value.toFixed(2),
          type: "相似度(示例)",
          description: `这两个商品的相似度为 ${link.value.toFixed(2)}，数值越高表示它们越相关。`
        });
      });
      
      setAnalysisResult(fallbackData);
      drawGraph(mockData, 'product');
    } finally {
      setLoading(false);
    }
  };
  
  // 生成模拟商品数据（当API请求失败时使用）
  const generateMockProductData = () => {
    return {
      nodes: [
        { id: "Product1", name: "iPhone 14 Pro", category: "电子产品", size: 5, price: 8999 },
        { id: "Product2", name: "MacBook Air", category: "电子产品", size: 5, price: 7999 },
        { id: "Product3", name: "AirPods Pro", category: "电子产品", size: 5, price: 1999 },
        { id: "Product4", name: "iPad mini", category: "电子产品", size: 5, price: 3799 },
        { id: "Product5", name: "Nike 运动鞋", category: "服装", size: 5, price: 899 },
        { id: "Product6", name: "Adidas 运动裤", category: "服装", size: 5, price: 599 },
        { id: "Product7", name: "优衣库 T恤", category: "服装", size: 5, price: 99 },
        { id: "Product8", name: "三只松鼠坚果", category: "食品", size: 5, price: 59.9 }
      ],
      links: [
        { source: "Product1", target: "Product2", value: 0.75, type: "同类" },
        { source: "Product1", target: "Product3", value: 0.82, type: "同类" },
        { source: "Product2", target: "Product4", value: 0.69, type: "同类" },
        { source: "Product5", target: "Product6", value: 0.85, type: "同类" },
        { source: "Product6", target: "Product7", value: 0.76, type: "同类" },
        { source: "Product1", target: "Product5", value: 0.35, type: "跨类" },
        { source: "Product3", target: "Product8", value: 0.28, type: "跨类" },
        { source: "Product4", target: "Product7", value: 0.31, type: "跨类" }
      ]
    };
  };
  
  // 社区发现
  const analyzeCommunities = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/advanced/communities');
      setGraphData(response.data);
      
      // 提取分析结果数据
      const analysisData = {
        title: "社区发现分析结果",
        description: "以下是基于社区划分的分析结果，展示了不同用户所属的社区：",
        items: []
      };
      
      // 计算每个社区的成员数量
      const communities = {};
      if (response.data.nodes) {
        response.data.nodes.forEach(node => {
          if (!communities[node.group]) {
            communities[node.group] = [];
          }
          communities[node.group].push(node.name || node.id);
        });
        
        // 添加到分析结果
        Object.keys(communities).forEach(community => {
          analysisData.items.push({
            name: community,
            value: communities[community].length,
            type: "社区成员数",
            description: `该社区包含 ${communities[community].length} 个成员: ${communities[community].join(', ')}`
          });
        });
      }
      
      setAnalysisResult(analysisData);
      drawGraph(response.data, 'community');
    } catch (error) {
      setError(`社区发现分析失败: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 绘制图
  const drawGraph = (data, type) => {
    if (!graphRef.current) return;
    
    // 清空画布
    d3.select(graphRef.current).selectAll("*").remove();
    
    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    // 创建SVG
    const svg = d3.select(graphRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // 准备节点数据（确保显示真实名称）
    const nodes = data.nodes.map(node => {
      return {
        ...node,
        label: node.name || node.id
      };
    });
    
    // 创建力导向图
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // 添加箭头标记（用于方向性边）
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-3L8,0L0,3")
      .attr("fill", "#666")
      .attr("opacity", 0.6);
    
    // 绘制连接线
    const links = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', d => {
        if (d.type && colors.edge[d.type]) {
          return colors.edge[d.type];
        }
        return colors.edge['好友']; // 默认颜色
      })
      .attr('stroke-width', d => d.value ? Math.min(d.value, 3) : 1)
      .attr('stroke-opacity', 0.6)
      .attr("marker-end", "url(#end)");
    
    // 创建节点组
    const nodeGroups = svg.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // 绘制节点
    nodeGroups.append('circle')
      .attr('r', d => d.size ? Math.sqrt(d.size) * 5 : 10)
      .attr('fill', d => {
        // 根据节点类型设置颜色
        if (type === 'user') {
          // 用户类型颜色
          return d.level && colors.node[d.level] ? colors.node[d.level] : colors.user;
        } else if (type === 'product') {
          // 商品类型颜色
          return d.category && colors.node[d.category] ? colors.node[d.category] : colors.product;
        } else if (type === 'community') {
          // 社区类型颜色
          return d.group && colors.node[d.group] ? colors.node[d.group] : colors.community;
        }
        return '#000';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // 添加节点标签（使用真实名称）
    nodeGroups.append('text')
      .text(d => d.label)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#000')
      .attr('dx', d => d.size ? Math.sqrt(d.size) * 5 + 2 : 12)
      .attr('dy', 4);
    
    // 如果是用户网络，添加用户类型标签
    if (type === 'user') {
      nodeGroups.filter(d => d.level)
        .append('text')
        .text(d => d.level)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .attr('dx', d => d.size ? Math.sqrt(d.size) * 5 + 2 : 12)
        .attr('dy', 18);
    }
    
    // 如果是产品网络，添加分类标签
    if (type === 'product') {
      nodeGroups.filter(d => d.category)
        .append('text')
        .text(d => d.category)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .attr('dx', d => d.size ? Math.sqrt(d.size) * 5 + 2 : 12)
        .attr('dy', 18);
    }
    
    // 如果是社区分析，添加社区标签
    if (type === 'community') {
      nodeGroups.filter(d => d.group)
        .append('text')
        .text(d => d.group)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .attr('dx', d => d.size ? Math.sqrt(d.size) * 5 + 2 : 12)
        .attr('dy', 18);
    }
    
    // 添加节点说明（如果有）- 显示完整信息
    nodeGroups.append('title')
      .text(d => {
        let tooltip = `${d.label}`;
        if (d.group) tooltip += `\n社区：${d.group}`;
        if (d.level) tooltip += `\n级别：${d.level}`;
        if (d.category) tooltip += `\n类别：${d.category}`;
        if (d.size) tooltip += `\n影响力：${d.size}`;
        if (d.price) tooltip += `\n价格：¥${d.price.toFixed(2)}`;
        return tooltip;
      });
    
    // 更新力导向图
    simulation.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // 拖拽函数
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // 添加图例
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 20)`)
      .attr('class', 'legend');
    
    legend.append('rect')
      .attr('width', 140)
      .attr('height', type === 'product' ? 140 : 100)
      .attr('fill', 'white')
      .attr('stroke', '#ddd')
      .attr('rx', 5)
      .attr('ry', 5);
    
    legend.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .text(type === 'user' ? '用户类型' : type === 'product' ? '商品类型' : '社区类型')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#000');
    
    if (type === 'user') {
      // 用户类型图例
      legend.append('circle').attr('cx', 20).attr('cy', 40).attr('r', 6).attr('fill', colors.node['VIP']);
      legend.append('text').attr('x', 35).attr('y', 44).text('VIP用户').attr('font-size', '12px').attr('fill', '#000');
      
      legend.append('circle').attr('cx', 20).attr('cy', 65).attr('r', 6).attr('fill', colors.node['普通']);
      legend.append('text').attr('x', 35).attr('y', 69).text('普通用户').attr('font-size', '12px').attr('fill', '#000');
      
      // 关系类型图例
      legend.append('text')
        .attr('x', 10)
        .attr('y', 90)
        .text('关系类型')
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .attr('fill', '#000');
      
      legend.append('line')
        .attr('x1', 15)
        .attr('y1', 110)
        .attr('x2', 30)
        .attr('y2', 110)
        .attr('stroke', colors.edge['好友'])
        .attr('stroke-width', 2);
      legend.append('text').attr('x', 35).attr('y', 114).text('好友关系').attr('font-size', '12px').attr('fill', '#000');
      
      legend.append('line')
        .attr('x1', 15)
        .attr('y1', 130)
        .attr('x2', 30)
        .attr('y2', 130)
        .attr('stroke', colors.edge['同事'])
        .attr('stroke-width', 2);
      legend.append('text').attr('x', 35).attr('y', 134).text('同事关系').attr('font-size', '12px').attr('fill', '#000');
      
    } else if (type === 'product') {
      // 商品类型图例
      legend.append('circle').attr('cx', 20).attr('cy', 40).attr('r', 6).attr('fill', colors.node['电子产品']);
      legend.append('text').attr('x', 35).attr('y', 44).text('电子产品').attr('font-size', '12px').attr('fill', '#000');
      
      legend.append('circle').attr('cx', 20).attr('cy', 65).attr('r', 6).attr('fill', colors.node['服装']);
      legend.append('text').attr('x', 35).attr('y', 69).text('服装').attr('font-size', '12px').attr('fill', '#000');
      
      legend.append('circle').attr('cx', 20).attr('cy', 90).attr('r', 6).attr('fill', colors.node['食品']);
      legend.append('text').attr('x', 35).attr('y', 94).text('食品').attr('font-size', '12px').attr('fill', '#000');
      
      // 关系类型图例
      legend.append('text')
        .attr('x', 10)
        .attr('y', 115)
        .text('关系类型')
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .attr('fill', '#000');
      
      legend.append('line')
        .attr('x1', 15)
        .attr('y1', 135)
        .attr('x2', 30)
        .attr('y2', 135)
        .attr('stroke', colors.edge['同类'])
        .attr('stroke-width', 2);
      legend.append('text').attr('x', 35).attr('y', 139).text('同类商品').attr('font-size', '12px').attr('fill', '#000');
      
      legend.append('line')
        .attr('x1', 15)
        .attr('y1', 155)
        .attr('x2', 30)
        .attr('y2', 155)
        .attr('stroke', colors.edge['跨类'])
        .attr('stroke-width', 2);
      legend.append('text').attr('x', 35).attr('y', 159).text('跨类商品').attr('font-size', '12px').attr('fill', '#000');
      
    } else if (type === 'community') {
      // 社区类型图例
      legend.append('circle').attr('cx', 20).attr('cy', 40).attr('r', 6).attr('fill', colors.node['Community1']);
      legend.append('text').attr('x', 35).attr('y', 44).text('社区1').attr('font-size', '12px').attr('fill', '#000');
      
      legend.append('circle').attr('cx', 20).attr('cy', 65).attr('r', 6).attr('fill', colors.node['Community2']);
      legend.append('text').attr('x', 35).attr('y', 69).text('社区2').attr('font-size', '12px').attr('fill', '#000');
      
      // 节点大小说明
      legend.append('text')
        .attr('x', 10)
        .attr('y', 90)
        .text('节点大小')
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .attr('fill', '#000');
      
      legend.append('text')
        .attr('x', 10)
        .attr('y', 110)
        .text('表示用户影响力')
        .attr('font-size', '12px')
        .attr('fill', '#000');
    }
  };
  
  return (
    <Container className="mt-4">
      <h2 className="mb-4">图计算分析</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                <Tab eventKey="user-network" title="用户关系网络">
                </Tab>
                <Tab eventKey="product-recommendations" title="商品关联推荐">
                </Tab>
                <Tab eventKey="communities" title="社区发现">
                </Tab>
              </Tabs>
            </Card.Header>
            <Card.Body>
              {activeTab === 'user-network' && (
                <div>
                  <Alert variant="info">
                    <Alert.Heading>用户关系网络分析说明</Alert.Heading>
                    <p>分析用户之间的关系网络，发现有影响力的用户和社交社区。</p>
                    <hr />
                    <p className="mb-0">
                      <Badge bg="warning" className="me-2">VIP用户</Badge>
                      <Badge bg="success" className="me-2">普通用户</Badge>
                      节点大小表示用户的影响力指数，越大表示影响力越高
                    </p>
                  </Alert>
                  <Button
                    variant="primary"
                    onClick={analyzeUserNetwork}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">分析中...</span>
                      </>
                    ) : (
                      '分析用户关系网络'
                    )}
                  </Button>
                </div>
              )}
              
              {activeTab === 'product-recommendations' && (
                <div>
                  <Alert variant="info">
                    <Alert.Heading>商品关联推荐分析说明</Alert.Heading>
                    <p>分析商品之间的关联关系，为用户提供个性化商品推荐。</p>
                    <hr />
                    <p className="mb-0">
                      <Badge bg="primary" className="me-2">电子产品</Badge>
                      <Badge bg="secondary" className="me-2">服装</Badge>
                      <Badge bg="warning" className="me-2">食品</Badge>
                      线条粗细表示商品相似度，越粗表示相似度越高
                    </p>
                  </Alert>
                  <Button
                    variant="primary"
                    onClick={analyzeProductRecommendations}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">分析中...</span>
                      </>
                    ) : (
                      '分析商品关联'
                    )}
                  </Button>
                </div>
              )}
              
              {activeTab === 'communities' && (
                <div>
                  <Alert variant="info">
                    <Alert.Heading>社区发现分析说明</Alert.Heading>
                    <p>发现用户社交网络中的社区结构，帮助制定精准营销策略。</p>
                    <hr />
                    <p className="mb-0">
                      <Badge bg="danger" className="me-2">社区1</Badge>
                      <Badge bg="success" className="me-2">社区2</Badge>
                      相同颜色的节点表示属于同一个社区，节点大小表示用户的影响力
                    </p>
                  </Alert>
                  <Button
                    variant="primary"
                    onClick={analyzeCommunities}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">分析中...</span>
                      </>
                    ) : (
                      '发现社区'
                    )}
                  </Button>
                </div>
              )}
              
              <div
                ref={graphRef}
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginTop: '20px'
                }}
              />
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>核心实现代码</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
              {activeTab === 'user-network' && (
                <SyntaxHighlighter language="java" style={tomorrow}>
                  {codeSnippets.userNetwork}
                </SyntaxHighlighter>
              )}
              
              {activeTab === 'product-recommendations' && (
                <SyntaxHighlighter language="java" style={tomorrow}>
                  {codeSnippets.productRecommendations}
                </SyntaxHighlighter>
              )}
              
              {activeTab === 'communities' && (
                <SyntaxHighlighter language="java" style={tomorrow}>
                  {codeSnippets.communities}
                </SyntaxHighlighter>
              )}
            </Card.Body>
          </Card>
          
          {analysisResult && (
            <Card className="mb-4">
              <Card.Header>
                <h5>{analysisResult.title}</h5>
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
                <p>{analysisResult.description}</p>
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th>数值</th>
                      <th>类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.value}</td>
                        <td>{item.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card.Body>
            </Card>
          )}
          
          {graphData && (
            <Card className="mb-4">
              <Card.Header>
                <h5>数据详情</h5>
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
                <SyntaxHighlighter language="json" style={tomorrow}>
                  {JSON.stringify(graphData, null, 2)}
                </SyntaxHighlighter>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default GraphAnalysisComponent; 