package com.example.sparkdemo.controller;

import com.example.sparkdemo.service.SparkAdvancedService;
import org.apache.spark.sql.*;
import org.apache.spark.sql.types.StructType;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructField;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.apache.spark.sql.RowFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Date;

@RestController
@RequestMapping("/api/advanced")
public class SparkAdvancedController {

    private static final Logger logger = LoggerFactory.getLogger(SparkAdvancedController.class);

    @Autowired
    private SparkAdvancedService sparkAdvancedService;

    @Autowired
    private SparkSession sparkSession;

    @PostMapping("/kmeans")
    public ResponseEntity<?> performKMeansClustering(@RequestBody List<Map<String, Object>> data) {
        try {
            logger.info("收到K-means聚类请求，数据点数量: {}", data.size());
            
            if (data == null || data.isEmpty()) {
                logger.warn("收到空数据请求");
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "数据不能为空",
                    "timestamp", System.currentTimeMillis()
                ));
            }

            // 验证数据格式
            for (Map<String, Object> item : data) {
                if (!item.containsKey("feature1") || !item.containsKey("feature2")) {
                    logger.warn("数据格式错误: {}", item);
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "数据格式错误，每个数据点必须包含feature1和feature2",
                        "timestamp", System.currentTimeMillis()
                    ));
                }
            }
            
            // 将输入数据转换为Dataset<Row>
            List<Row> rows = new ArrayList<>();
            for (Map<String, Object> item : data) {
                try {
                    double feature1 = Double.valueOf(item.get("feature1").toString());
                    double feature2 = Double.valueOf(item.get("feature2").toString());
                    rows.add(RowFactory.create(feature1, feature2));
                } catch (NumberFormatException e) {
                    logger.warn("数据转换错误: {}", item, e);
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "数据转换错误，feature1和feature2必须是数字",
                        "timestamp", System.currentTimeMillis()
                    ));
                }
            }
            
            logger.debug("创建了{}行数据", rows.size());
            
            StructType schema = new StructType()
                .add("feature1", DataTypes.DoubleType)
                .add("feature2", DataTypes.DoubleType);
                
            Dataset<Row> dataset = sparkSession.createDataFrame(rows, schema);
            logger.debug("创建数据集，schema: {}", dataset.schema().treeString());
            
            Map<String, Object> result = sparkAdvancedService.performKMeansClustering(dataset);
            logger.info("K-means聚类完成");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("K-means聚类过程中发生错误", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "服务器内部错误: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * 用户行为聚类分析
     * 分析用户的购物行为特征，将用户分为不同的群体
     * 输入数据格式：
     * [
     *   {
     *     "monthlySpending": 1000.0,    // 月均消费金额
     *     "purchaseFrequency": 5.0      // 月均购买次数
     *   },
     *   ...
     * ]
     */
    @PostMapping("/user-clustering")
    public ResponseEntity<?> performUserBehaviorClustering(@RequestBody List<Map<String, Object>> data) {
        try {
            logger.info("开始用户行为聚类分析，数据点数量: {}", data.size());
            
            if (data == null || data.isEmpty()) {
                logger.warn("收到空的用户行为数据");
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "用户行为数据不能为空",
                    "timestamp", new Date()
                ));
            }

            // 验证数据格式
            for (Map<String, Object> point : data) {
                if (!point.containsKey("monthlySpending") || !point.containsKey("purchaseFrequency")) {
                    logger.warn("数据格式错误: {}", point);
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "每个数据点必须包含 monthlySpending 和 purchaseFrequency 字段",
                        "timestamp", new Date()
                    ));
                }
            }

            // 创建Spark DataFrame的schema
            StructType schema = new StructType(new StructField[]{
                DataTypes.createStructField("monthlySpending", DataTypes.DoubleType, false),
                DataTypes.createStructField("purchaseFrequency", DataTypes.DoubleType, false)
            });

            // 将数据转换为Spark DataFrame
            List<Row> rows = new ArrayList<>();
            for (Map<String, Object> point : data) {
                try {
                    double monthlySpending = Double.parseDouble(point.get("monthlySpending").toString());
                    double purchaseFrequency = Double.parseDouble(point.get("purchaseFrequency").toString());
                    rows.add(RowFactory.create(monthlySpending, purchaseFrequency));
                } catch (NumberFormatException e) {
                    logger.warn("数据转换失败: {}", point, e);
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "数据格式转换失败，请确保数值字段为数字类型",
                        "timestamp", new Date()
                    ));
                }
            }

            Dataset<Row> df = sparkSession.createDataFrame(rows, schema);
            logger.info("成功创建用户行为数据集，包含{}条记录", df.count());

            // 调用服务层进行聚类分析
            Map<String, Object> result = sparkAdvancedService.performUserBehaviorClustering(df);
            
            logger.info("用户行为聚类分析完成");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("用户行为聚类分析过程中发生错误", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "用户行为聚类分析失败: " + e.getMessage(),
                "timestamp", new Date()
            ));
        }
    }
}