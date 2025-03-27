package com.example.sparkdemo.controller;

import com.example.sparkdemo.service.SparkGraphService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/advanced")
@CrossOrigin(origins = "*", allowedHeaders = "*") // 允许所有来源的跨域请求
public class SparkGraphController {
    private static final Logger logger = LoggerFactory.getLogger(SparkGraphController.class);
    
    @Autowired
    private SparkGraphService sparkGraphService;

    @GetMapping("/user-network")
    public ResponseEntity<?> analyzeUserNetwork() {
        try {
            logger.info("接收到用户关系网络分析请求");
            Map<String, Object> result = sparkGraphService.analyzeUserNetwork();
            
            // 格式化响应为D3.js可用的格式
            List<Map<String, Object>> nodes = new ArrayList<>();
            List<Map<String, Object>> links = new ArrayList<>();
            
            // 处理顶点数据，提取用户名和级别
            List<Map<String, Object>> vertices = (List<Map<String, Object>>) result.get("vertices");
            if (vertices != null) {
                // 提取顶点信息
                for (Map<String, Object> vertex : vertices) {
                    Map<String, Object> vertexData = (Map<String, Object>) vertex.get("_2");
                    String userId = "User" + vertex.get("_1");
                    String userName = (String) vertexData.getOrDefault("name", userId);
                    String userLevel = (String) vertexData.getOrDefault("level", "普通");
                    double spending = (double) vertexData.getOrDefault("spending", 0.0);
                    
                    // 计算节点大小（基于消费额）
                    int nodeSize = (int) (spending / 500) + 5; 
                    
                    Map<String, Object> node = new HashMap<>();
                    node.put("id", userId);
                    node.put("name", userName);
                    node.put("level", userLevel);
                    node.put("size", nodeSize);
                    nodes.add(node);
                }
            }
            
            // 处理边数据
            List<Map<String, Object>> edges = (List<Map<String, Object>>) result.get("edges");
            if (edges != null) {
                for (Map<String, Object> edge : edges) {
                    String source = "User" + edge.get("srcId");
                    String target = "User" + edge.get("dstId");
                    Map<String, Object> edgeAttr = (Map<String, Object>) edge.get("attr");
                    String type = (String) edgeAttr.getOrDefault("type", "关系");
                    double weight = (double) edgeAttr.getOrDefault("weight", 1.0);
                    
                    Map<String, Object> link = new HashMap<>();
                    link.put("source", source);
                    link.put("target", target);
                    link.put("value", weight);
                    link.put("type", type);
                    links.add(link);
                }
            }
            
            Map<String, Object> graphData = new HashMap<>();
            graphData.put("nodes", nodes);
            graphData.put("links", links);
            
            logger.info("用户关系网络分析完成，返回结果");
            return ResponseEntity.ok(graphData);
        } catch (Exception e) {
            logger.error("用户关系网络分析失败: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "用户关系网络分析失败: " + e.getMessage());
            error.put("timestamp", new Date());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/product-recommendations")
    public ResponseEntity<?> analyzeProductRecommendations() {
        try {
            logger.info("接收到商品关联推荐分析请求");
            Map<String, Object> result = sparkGraphService.analyzeProductRecommendations();
            
            // 格式化响应为D3.js可用的格式
            List<Map<String, Object>> nodes = new ArrayList<>();
            List<Map<String, Object>> links = new ArrayList<>();
            
            // 处理顶点数据，提取商品名和类别
            List<Map<String, Object>> products = (List<Map<String, Object>>) result.get("products");
            Map<String, String> productIdToName = new HashMap<>();
            Map<String, String> productIdToCategory = new HashMap<>();
            
            if (products != null) {
                for (Map<String, Object> product : products) {
                    Map<String, Object> productData = (Map<String, Object>) product.get("_2");
                    String productId = "Product" + product.get("_1");
                    String productName = (String) productData.getOrDefault("name", productId);
                    String category = (String) productData.getOrDefault("category", "未分类");
                    double price = (double) productData.getOrDefault("price", 0.0);
                    
                    // 保存商品ID到名称的映射
                    productIdToName.put(productId, productName);
                    productIdToCategory.put(productId, category);
                    
                    Map<String, Object> node = new HashMap<>();
                    node.put("id", productId);
                    node.put("name", productName);
                    node.put("category", category);
                    node.put("price", price);
                    node.put("size", 5); // 固定大小
                    nodes.add(node);
                }
            }
            
            // 处理边数据（相似度）
            List<Map<String, Object>> similarities = (List<Map<String, Object>>) result.get("similarities");
            if (similarities != null) {
                for (Map<String, Object> similarity : similarities) {
                    String source = "Product" + similarity.get("srcId");
                    String target = "Product" + similarity.get("dstId");
                    
                    // 修复attr类型转换问题
                    Object attrObj = similarity.get("attr");
                    double value = 0.5; // 默认值
                    String type = "跨类"; // 默认类型
                    
                    if (attrObj instanceof Map) {
                        Map<String, Object> attrMap = (Map<String, Object>) attrObj;
                        if (attrMap.containsKey("weight")) {
                            value = (double) attrMap.get("weight");
                        }
                        if (attrMap.containsKey("type")) {
                            type = (String) attrMap.get("type");
                        }
                    } else if (attrObj instanceof Double) {
                        // 直接是Double类型的情况
                        value = (double) attrObj;
                    }
                    
                    // 根据商品类别确认边类型（如果上面没有获取到类型）
                    if ("跨类".equals(type) && productIdToCategory.containsKey(source) && 
                        productIdToCategory.containsKey(target) && 
                        productIdToCategory.get(source).equals(productIdToCategory.get(target))) {
                        type = "同类";
                    }
                    
                    Map<String, Object> link = new HashMap<>();
                    link.put("source", source);
                    link.put("target", target);
                    link.put("value", value);
                    link.put("type", type);
                    links.add(link);
                }
            }
            
            Map<String, Object> graphData = new HashMap<>();
            graphData.put("nodes", nodes);
            graphData.put("links", links);
            
            logger.info("商品关联推荐分析完成，返回结果");
            return ResponseEntity.ok(graphData);
        } catch (Exception e) {
            logger.error("商品关联推荐分析失败: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "商品关联推荐分析失败: " + e.getMessage());
            error.put("timestamp", new Date());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/communities")
    public ResponseEntity<?> analyzeCommunities() {
        try {
            logger.info("接收到社区发现分析请求");
            Map<String, Object> result = sparkGraphService.analyzeCommunities();
            
            // 格式化响应为D3.js可用的格式
            List<Map<String, Object>> nodes = new ArrayList<>();
            List<Map<String, Object>> links = new ArrayList<>();
            
            // 处理顶点数据和社区数据
            List<Map<String, Object>> communities = (List<Map<String, Object>>) result.get("communities");
            if (communities != null) {
                Map<String, Map<String, Object>> idToNode = new HashMap<>();
                
                // 首先构建节点
                for (Map<String, Object> community : communities) {
                    Map<String, Object> communityData = (Map<String, Object>) community.get("_2");
                    String userId = "User" + community.get("_1");
                    String userName = (String) communityData.getOrDefault("name", userId);
                    String communityId = (String) communityData.getOrDefault("community", "社区0");
                    String userLevel = (String) communityData.getOrDefault("level", "普通");
                    double spending = (double) communityData.getOrDefault("spending", 0.0);
                    
                    // 构建社区名称
                    String communityName = "社区" + communityId.substring(Math.max(0, communityId.length() - 1));
                    
                    // 计算节点大小（基于消费额）
                    int nodeSize = (int) (spending / 500) + 5;
                    
                    Map<String, Object> node = new HashMap<>();
                    node.put("id", userId);
                    node.put("name", userName);
                    node.put("group", communityName);
                    node.put("level", userLevel);
                    node.put("size", nodeSize);
                    nodes.add(node);
                    idToNode.put(userId, node);
                }
            }
            
            // 处理边数据
            List<Map<String, Object>> edges = (List<Map<String, Object>>) result.get("edges");
            if (edges != null) {
                for (Map<String, Object> edge : edges) {
                    String source = "User" + edge.get("srcId");
                    String target = "User" + edge.get("dstId");
                    Map<String, Object> edgeAttr = (Map<String, Object>) edge.get("attr");
                    String type = (String) edgeAttr.getOrDefault("type", "关系");
                    double weight = (double) edgeAttr.getOrDefault("weight", 1.0);
                    
                    Map<String, Object> link = new HashMap<>();
                    link.put("source", source);
                    link.put("target", target);
                    link.put("value", weight);
                    link.put("type", type);
                    links.add(link);
                }
            }
            
            Map<String, Object> graphData = new HashMap<>();
            graphData.put("nodes", nodes);
            graphData.put("links", links);
            
            logger.info("社区发现分析完成，返回结果");
            return ResponseEntity.ok(graphData);
        } catch (Exception e) {
            logger.error("社区发现分析失败: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "社区发现分析失败: " + e.getMessage());
            error.put("timestamp", new Date());
            return ResponseEntity.status(500).body(error);
        }
    }
} 