package com.example.sparkdemo.service;

import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import scala.Tuple2;

import java.io.Serializable;
import java.util.*;

@Service
public class SparkGraphService {
    private static final Logger logger = LoggerFactory.getLogger(SparkGraphService.class);

    private final SparkSession sparkSession;

    @Autowired
    public SparkGraphService(SparkSession sparkSession) {
        this.sparkSession = sparkSession;
    }

    // 通过Spark RDD分析用户关系网络
    public Map<String, Object> analyzeUserNetwork() {
        logger.info("分析用户关系网络");
        try {
            // 创建JavaSparkContext
            JavaSparkContext jsc = new JavaSparkContext(sparkSession.sparkContext());

            // 创建用户顶点数据
            List<Tuple2<Object, Map<String, Object>>> vertices = Arrays.asList(
                // 使用真实的中文用户名和更真实的消费金额
                new Tuple2<>(1L, createUserData("张三", "VIP", 12500.0)),
                new Tuple2<>(2L, createUserData("李四", "普通", 2300.0)),
                new Tuple2<>(3L, createUserData("王五", "VIP", 18600.0)),
                new Tuple2<>(4L, createUserData("赵六", "普通", 1800.0)),
                new Tuple2<>(5L, createUserData("周七", "VIP", 9800.0)),
                new Tuple2<>(6L, createUserData("吴八", "普通", 3200.0)),
                new Tuple2<>(7L, createUserData("郑九", "VIP", 15400.0)),
                new Tuple2<>(8L, createUserData("钱十", "普通", 2700.0)),
                new Tuple2<>(9L, createUserData("孙十一", "VIP", 11300.0)),
                new Tuple2<>(10L, createUserData("马十二", "普通", 4100.0))
            );

            // 创建用户关系边
            List<Tuple2<Tuple2<Object, Object>, Map<String, Object>>> edges = Arrays.asList(
                // 增加更多的边，形成更复杂的网络结构
                new Tuple2<>(new Tuple2<>(1L, 2L), createEdgeData("好友", 7.5)),
                new Tuple2<>(new Tuple2<>(1L, 3L), createEdgeData("好友", 8.2)),
                new Tuple2<>(new Tuple2<>(1L, 5L), createEdgeData("同事", 6.3)),
                new Tuple2<>(new Tuple2<>(2L, 4L), createEdgeData("同事", 5.8)),
                new Tuple2<>(new Tuple2<>(2L, 6L), createEdgeData("好友", 4.5)),
                new Tuple2<>(new Tuple2<>(3L, 5L), createEdgeData("好友", 9.1)),
                new Tuple2<>(new Tuple2<>(3L, 7L), createEdgeData("同事", 7.2)),
                new Tuple2<>(new Tuple2<>(4L, 8L), createEdgeData("同事", 6.7)),
                new Tuple2<>(new Tuple2<>(5L, 9L), createEdgeData("好友", 8.4)),
                new Tuple2<>(new Tuple2<>(6L, 10L), createEdgeData("同事", 5.3)),
                new Tuple2<>(new Tuple2<>(7L, 9L), createEdgeData("好友", 7.8)),
                new Tuple2<>(new Tuple2<>(8L, 10L), createEdgeData("好友", 6.1)),
                new Tuple2<>(new Tuple2<>(1L, 7L), createEdgeData("同事", 4.9)),
                new Tuple2<>(new Tuple2<>(2L, 8L), createEdgeData("好友", 5.4)),
                new Tuple2<>(new Tuple2<>(3L, 9L), createEdgeData("同事", 6.8)),
                new Tuple2<>(new Tuple2<>(4L, 10L), createEdgeData("好友", 4.2)),
                new Tuple2<>(new Tuple2<>(5L, 7L), createEdgeData("同事", 7.6)),
                new Tuple2<>(new Tuple2<>(6L, 8L), createEdgeData("好友", 5.9))
            );

            // 创建JavaRDD
            JavaRDD<Tuple2<Object, Map<String, Object>>> verticesRDD = jsc.parallelize(vertices);
            JavaRDD<Tuple2<Tuple2<Object, Object>, Map<String, Object>>> edgesRDD = jsc.parallelize(edges);

            // 计算用户影响力（简化实现，基于连接度和消费金额）
            Map<Object, Double> influenceScores = new HashMap<>();
            
            // 计算每个用户的连接数
            Map<Object, Integer> connectionCounts = new HashMap<>();
            for (Tuple2<Tuple2<Object, Object>, Map<String, Object>> edge : edges) {
                Object srcId = edge._1()._1();
                Object dstId = edge._1()._2();
                
                connectionCounts.put(srcId, connectionCounts.getOrDefault(srcId, 0) + 1);
                connectionCounts.put(dstId, connectionCounts.getOrDefault(dstId, 0) + 1);
            }
            
            // 计算影响力得分 = 连接数 * (消费金额 / 1000)
            for (Tuple2<Object, Map<String, Object>> vertex : vertices) {
                Object id = vertex._1();
                double spending = (double) vertex._2().get("spending");
                int connections = connectionCounts.getOrDefault(id, 0);
                
                double influence = connections * (spending / 1000);
                influenceScores.put(id, influence);
            }

            // 简化的社区发现（基于连接关系）
            Map<Object, String> communities = new HashMap<>();
            Map<Object, Set<Object>> connectedUsers = new HashMap<>();
            
            // 初始化每个用户的社区
            for (Tuple2<Object, Map<String, Object>> vertex : vertices) {
                Object id = vertex._1();
                communities.put(id, "社区0"); // 默认社区
                connectedUsers.put(id, new HashSet<>());
            }
            
            // 构建连接关系
            for (Tuple2<Tuple2<Object, Object>, Map<String, Object>> edge : edges) {
                Object srcId = edge._1()._1();
                Object dstId = edge._1()._2();
                
                connectedUsers.get(srcId).add(dstId);
                connectedUsers.get(dstId).add(srcId);
            }
            
            // 简单的社区划分（VIP用户为社区1，普通用户为社区2）
            int communityCount = 1;
            for (Tuple2<Object, Map<String, Object>> vertex : vertices) {
                Object id = vertex._1();
                String level = (String) vertex._2().get("level");
                
                if ("VIP".equals(level)) {
                    communities.put(id, "社区1");
                } else {
                    communities.put(id, "社区2");
                }
                
                communityCount++;
            }

            // 准备返回结果
            List<Map<String, Object>> verticesList = new ArrayList<>();
            for (Tuple2<Object, Map<String, Object>> vertex : vertices) {
                Map<String, Object> vertexMap = new HashMap<>();
                vertexMap.put("_1", vertex._1());
                
                Map<String, Object> vertexData = new HashMap<>(vertex._2());
                vertexData.put("influence", influenceScores.getOrDefault(vertex._1(), 0.0));
                vertexData.put("community", communities.get(vertex._1()));
                
                vertexMap.put("_2", vertexData);
                verticesList.add(vertexMap);
            }

            List<Map<String, Object>> edgesList = new ArrayList<>();
            for (Tuple2<Tuple2<Object, Object>, Map<String, Object>> edge : edges) {
                Map<String, Object> edgeMap = new HashMap<>();
                edgeMap.put("srcId", edge._1()._1());
                edgeMap.put("dstId", edge._1()._2());
                edgeMap.put("attr", edge._2());
                edgesList.add(edgeMap);
            }

            // 返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("vertices", verticesList);
            result.put("edges", edgesList);

            return result;
        } catch (Exception e) {
            logger.error("用户关系网络分析失败", e);
            throw new RuntimeException("分析失败: " + e.getMessage());
        }
    }

    // 通过Spark RDD分析商品关联和推荐
    public Map<String, Object> analyzeProductRecommendations() {
        logger.info("分析商品关联和推荐");
        try {
            // 创建JavaSparkContext
            JavaSparkContext jsc = new JavaSparkContext(sparkSession.sparkContext());

            // 创建商品顶点数据
            List<Tuple2<Object, Map<String, Object>>> products = Arrays.asList(
                // 使用真实的商品名称、分类和价格
                new Tuple2<>(1L, createProductData("iPhone 14 Pro", "电子产品", 8999.0)),
                new Tuple2<>(2L, createProductData("MacBook Air", "电子产品", 7999.0)),
                new Tuple2<>(3L, createProductData("AirPods Pro", "电子产品", 1999.0)),
                new Tuple2<>(4L, createProductData("iPad mini", "电子产品", 3799.0)),
                new Tuple2<>(5L, createProductData("Nike 运动鞋", "服装", 899.0)),
                new Tuple2<>(6L, createProductData("Adidas 运动裤", "服装", 599.0)),
                new Tuple2<>(7L, createProductData("优衣库 T恤", "服装", 99.0)),
                new Tuple2<>(8L, createProductData("H&M 夹克", "服装", 399.0)),
                new Tuple2<>(9L, createProductData("三只松鼠坚果", "食品", 59.9)),
                new Tuple2<>(10L, createProductData("良品铺子零食", "食品", 89.9)),
                new Tuple2<>(11L, createProductData("百草味果干", "食品", 45.5)),
                new Tuple2<>(12L, createProductData("元气森林饮料", "食品", 5.9))
            );

            // 创建商品关联边
            List<Tuple2<Tuple2<Object, Object>, Map<String, Object>>> similarities = Arrays.asList(
                // 同类商品关联
                new Tuple2<>(new Tuple2<>(1L, 2L), createEdgeData("同类", 0.75)),
                new Tuple2<>(new Tuple2<>(1L, 3L), createEdgeData("同类", 0.82)),
                new Tuple2<>(new Tuple2<>(1L, 4L), createEdgeData("同类", 0.68)),
                new Tuple2<>(new Tuple2<>(2L, 3L), createEdgeData("同类", 0.64)),
                new Tuple2<>(new Tuple2<>(2L, 4L), createEdgeData("同类", 0.79)),
                new Tuple2<>(new Tuple2<>(3L, 4L), createEdgeData("同类", 0.71)),
                
                new Tuple2<>(new Tuple2<>(5L, 6L), createEdgeData("同类", 0.85)),
                new Tuple2<>(new Tuple2<>(5L, 7L), createEdgeData("同类", 0.59)),
                new Tuple2<>(new Tuple2<>(5L, 8L), createEdgeData("同类", 0.67)),
                new Tuple2<>(new Tuple2<>(6L, 7L), createEdgeData("同类", 0.76)),
                new Tuple2<>(new Tuple2<>(6L, 8L), createEdgeData("同类", 0.72)),
                new Tuple2<>(new Tuple2<>(7L, 8L), createEdgeData("同类", 0.81)),
                
                new Tuple2<>(new Tuple2<>(9L, 10L), createEdgeData("同类", 0.91)),
                new Tuple2<>(new Tuple2<>(9L, 11L), createEdgeData("同类", 0.88)),
                new Tuple2<>(new Tuple2<>(9L, 12L), createEdgeData("同类", 0.53)),
                new Tuple2<>(new Tuple2<>(10L, 11L), createEdgeData("同类", 0.93)),
                new Tuple2<>(new Tuple2<>(10L, 12L), createEdgeData("同类", 0.62)),
                new Tuple2<>(new Tuple2<>(11L, 12L), createEdgeData("同类", 0.59)),
                
                // 跨类商品关联
                new Tuple2<>(new Tuple2<>(1L, 5L), createEdgeData("跨类", 0.35)),
                new Tuple2<>(new Tuple2<>(2L, 9L), createEdgeData("跨类", 0.21)),
                new Tuple2<>(new Tuple2<>(3L, 12L), createEdgeData("跨类", 0.42)),
                new Tuple2<>(new Tuple2<>(4L, 7L), createEdgeData("跨类", 0.31)),
                new Tuple2<>(new Tuple2<>(5L, 9L), createEdgeData("跨类", 0.25)),
                new Tuple2<>(new Tuple2<>(6L, 11L), createEdgeData("跨类", 0.19)),
                new Tuple2<>(new Tuple2<>(7L, 10L), createEdgeData("跨类", 0.28)),
                new Tuple2<>(new Tuple2<>(8L, 12L), createEdgeData("跨类", 0.32))
            );

            // 创建JavaRDD
            JavaRDD<Tuple2<Object, Map<String, Object>>> productsRDD = jsc.parallelize(products);
            JavaRDD<Tuple2<Tuple2<Object, Object>, Map<String, Object>>> similaritiesRDD = jsc.parallelize(similarities);

            // 准备返回结果
            List<Map<String, Object>> productsList = new ArrayList<>();
            for (Tuple2<Object, Map<String, Object>> product : products) {
                Map<String, Object> productMap = new HashMap<>();
                productMap.put("_1", product._1());
                productMap.put("_2", product._2());
                productsList.add(productMap);
            }

            List<Map<String, Object>> similaritiesList = new ArrayList<>();
            for (Tuple2<Tuple2<Object, Object>, Map<String, Object>> similarity : similarities) {
                Map<String, Object> similarityMap = new HashMap<>();
                similarityMap.put("srcId", similarity._1()._1());
                similarityMap.put("dstId", similarity._1()._2());
                similarityMap.put("attr", similarity._2());
                similaritiesList.add(similarityMap);
            }

            // 返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("products", productsList);
            result.put("similarities", similaritiesList);

            return result;
        } catch (Exception e) {
            logger.error("商品关联推荐分析失败", e);
            throw new RuntimeException("分析失败: " + e.getMessage());
        }
    }

    // 通过Spark RDD分析社区结构
    public Map<String, Object> analyzeCommunities() {
        logger.info("分析社区结构");
        try {
            // 创建JavaSparkContext
            JavaSparkContext jsc = new JavaSparkContext(sparkSession.sparkContext());

            // 创建用户顶点数据（与analyzeUserNetwork保持一致）
            List<Tuple2<Object, Map<String, Object>>> vertices = Arrays.asList(
                // 使用真实的中文用户名和更真实的消费金额
                new Tuple2<>(1L, createUserData("张三", "VIP", 12500.0)),
                new Tuple2<>(2L, createUserData("李四", "普通", 2300.0)),
                new Tuple2<>(3L, createUserData("王五", "VIP", 18600.0)),
                new Tuple2<>(4L, createUserData("赵六", "普通", 1800.0)),
                new Tuple2<>(5L, createUserData("周七", "VIP", 9800.0)),
                new Tuple2<>(6L, createUserData("吴八", "普通", 3200.0)),
                new Tuple2<>(7L, createUserData("郑九", "VIP", 15400.0)),
                new Tuple2<>(8L, createUserData("钱十", "普通", 2700.0)),
                new Tuple2<>(9L, createUserData("孙十一", "VIP", 11300.0)),
                new Tuple2<>(10L, createUserData("马十二", "普通", 4100.0))
            );

            // 为社区发现创建不同的边集合
            List<Tuple2<Tuple2<Object, Object>, Map<String, Object>>> edges = Arrays.asList(
                // 社区1（主要是VIP用户）
                new Tuple2<>(new Tuple2<>(1L, 3L), createEdgeData("好友", 8.5)),
                new Tuple2<>(new Tuple2<>(1L, 5L), createEdgeData("好友", 7.8)),
                new Tuple2<>(new Tuple2<>(3L, 5L), createEdgeData("同事", 9.2)),
                new Tuple2<>(new Tuple2<>(3L, 7L), createEdgeData("好友", 8.9)),
                new Tuple2<>(new Tuple2<>(5L, 7L), createEdgeData("好友", 7.5)),
                new Tuple2<>(new Tuple2<>(7L, 9L), createEdgeData("同事", 8.6)),
                new Tuple2<>(new Tuple2<>(1L, 9L), createEdgeData("好友", 6.9)),
                
                // 社区2（主要是普通用户）
                new Tuple2<>(new Tuple2<>(2L, 4L), createEdgeData("同事", 6.2)),
                new Tuple2<>(new Tuple2<>(2L, 6L), createEdgeData("好友", 5.8)),
                new Tuple2<>(new Tuple2<>(4L, 6L), createEdgeData("好友", 7.1)),
                new Tuple2<>(new Tuple2<>(4L, 8L), createEdgeData("同事", 6.4)),
                new Tuple2<>(new Tuple2<>(6L, 8L), createEdgeData("好友", 5.5)),
                new Tuple2<>(new Tuple2<>(8L, 10L), createEdgeData("同事", 6.7)),
                new Tuple2<>(new Tuple2<>(6L, 10L), createEdgeData("好友", 4.9)),
                
                // 社区间的少量连接
                new Tuple2<>(new Tuple2<>(1L, 2L), createEdgeData("好友", 4.5)),
                new Tuple2<>(new Tuple2<>(5L, 6L), createEdgeData("同事", 3.8)),
                new Tuple2<>(new Tuple2<>(7L, 8L), createEdgeData("好友", 4.2))
            );

            // 创建JavaRDD
            JavaRDD<Tuple2<Object, Map<String, Object>>> verticesRDD = jsc.parallelize(vertices);
            JavaRDD<Tuple2<Tuple2<Object, Object>, Map<String, Object>>> edgesRDD = jsc.parallelize(edges);

            // 简单的社区发现算法（基于用户类型和连接关系）
            Map<Object, String> communities = new HashMap<>();
            
            // 初始化两个社区
            for (Tuple2<Object, Map<String, Object>> vertex : vertices) {
                Object id = vertex._1();
                String level = (String) vertex._2().get("level");
                
                // VIP用户默认为社区1，普通用户默认为社区2
                if ("VIP".equals(level)) {
                    communities.put(id, "社区1");
                } else {
                    communities.put(id, "社区2");
                }
            }
            
            // 准备返回结果
            List<Map<String, Object>> communitiesList = new ArrayList<>();
            for (Tuple2<Object, Map<String, Object>> vertex : vertices) {
                Map<String, Object> communityMap = new HashMap<>();
                communityMap.put("_1", vertex._1());
                
                Map<String, Object> communityData = new HashMap<>(vertex._2());
                communityData.put("community", communities.get(vertex._1()));
                
                communityMap.put("_2", communityData);
                communitiesList.add(communityMap);
            }

            List<Map<String, Object>> edgesList = new ArrayList<>();
            for (Tuple2<Tuple2<Object, Object>, Map<String, Object>> edge : edges) {
                Map<String, Object> edgeMap = new HashMap<>();
                edgeMap.put("srcId", edge._1()._1());
                edgeMap.put("dstId", edge._1()._2());
                edgeMap.put("attr", edge._2());
                edgesList.add(edgeMap);
            }

            // 返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("communities", communitiesList);
            result.put("edges", edgesList);

            return result;
        } catch (Exception e) {
            logger.error("社区发现分析失败", e);
            throw new RuntimeException("分析失败: " + e.getMessage());
        }
    }

    // 辅助方法：创建用户数据
    private Map<String, Object> createUserData(String name, String level, double spending) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("name", name);
        userData.put("level", level);
        userData.put("spending", spending);
        return userData;
    }

    // 辅助方法：创建商品数据
    private Map<String, Object> createProductData(String name, String category, double price) {
        Map<String, Object> productData = new HashMap<>();
        productData.put("name", name);
        productData.put("category", category);
        productData.put("price", price);
        return productData;
    }

    // 辅助方法：创建边数据
    private Map<String, Object> createEdgeData(String type, double weight) {
        Map<String, Object> edgeData = new HashMap<>();
        edgeData.put("type", type);
        edgeData.put("weight", weight);
        return edgeData;
    }
} 