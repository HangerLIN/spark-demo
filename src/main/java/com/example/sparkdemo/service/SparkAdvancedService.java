package com.example.sparkdemo.service;

import org.apache.spark.ml.clustering.KMeans;
import org.apache.spark.ml.clustering.KMeansModel;
import org.apache.spark.ml.feature.VectorAssembler;
import org.apache.spark.ml.linalg.Vector;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.streaming.StreamingQuery;
import org.apache.spark.sql.streaming.StreamingQueryException;
import org.apache.spark.sql.types.StructType;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructField;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.apache.spark.sql.functions;
import static org.apache.spark.sql.functions.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.List;
import java.util.ArrayList;

@Service
public class SparkAdvancedService {

    private static final Logger logger = LoggerFactory.getLogger(SparkAdvancedService.class);

    private final SparkSession sparkSession;

    public SparkAdvancedService(SparkSession sparkSession) {
        this.sparkSession = sparkSession;
    }

    /**
     * K-means聚类分析
     */
    public Map<String, Object> performKMeansClustering(Dataset<Row> data) {
        try {
            logger.info("开始K-means聚类分析，数据集schema: {}", data.schema().treeString());
            
            if (data == null || data.isEmpty()) {
                throw new IllegalArgumentException("输入数据集不能为空");
            }
            
            // 创建特征向量
            VectorAssembler assembler = new VectorAssembler()
                .setInputCols(new String[]{"feature1", "feature2"})
                .setOutputCol("features");
                
            logger.debug("创建VectorAssembler");
            Dataset<Row> vectorData = assembler.transform(data);
            logger.debug("数据转换为特征向量完成");
            
            // 训练K-means模型
            KMeans kmeans = new KMeans()
                .setK(3)  // 设置聚类数为3
                .setSeed(1L)
                .setMaxIter(20)  // 设置最大迭代次数
                .setTol(1e-4);   // 设置收敛容差
                
            logger.debug("创建KMeans实例，k=3");
            KMeansModel model = kmeans.fit(vectorData);
            logger.info("KMeans模型训练完成");
            
            // 预测聚类结果
            Dataset<Row> predictions = model.transform(vectorData);
            logger.debug("完成聚类预测");
            
            // 计算每个簇的中心点
            Vector[] centers = model.clusterCenters();
            logger.debug("获取聚类中心点");
            
            // 收集结果
            Map<String, Object> result = new HashMap<>();
            
            // 将预测结果转换为可序列化的格式
            List<Map<String, Object>> predictionsList = new ArrayList<>();
            for (Row row : predictions.select("feature1", "feature2", "prediction").collectAsList()) {
                Map<String, Object> predictionMap = new HashMap<>();
                predictionMap.put("feature1", row.getDouble(0));
                predictionMap.put("feature2", row.getDouble(1));
                predictionMap.put("cluster", row.getInt(2));
                predictionsList.add(predictionMap);
            }
            result.put("predictions", predictionsList);
            logger.debug("收集{}个预测结果", predictionsList.size());
            
            // 将中心点转换为可序列化的格式
            List<Map<String, Double>> centersList = new ArrayList<>();
            for (Vector center : centers) {
                Map<String, Double> centerMap = new HashMap<>();
                centerMap.put("feature1", center.apply(0));
                centerMap.put("feature2", center.apply(1));
                centersList.add(centerMap);
            }
            result.put("centers", centersList);
            logger.debug("添加{}个聚类中心点", centersList.size());
            
            // 计算模型评估指标
            double cost = model.summary().trainingCost();
            result.put("cost", cost);
            logger.debug("模型代价: {}", cost);
            
            logger.info("K-means聚类分析完成");
            return result;
        } catch (Exception e) {
            logger.error("K-means聚类分析过程中发生错误", e);
            throw new RuntimeException("K-means聚类分析失败: " + e.getMessage(), e);
        }
    }

    /**
     * 实时流处理 - 使用Spark Streaming处理Kafka数据
     */
    public void startStreamProcessing() throws StreamingQueryException, TimeoutException {
        // 定义流式数据的schema
        StructType schema = new StructType()
            .add("timestamp", DataTypes.TimestampType)
            .add("userId", DataTypes.LongType)
            .add("action", DataTypes.StringType)
            .add("value", DataTypes.DoubleType);

        // 从Kafka读取流式数据
        Dataset<Row> streamData = sparkSession
            .readStream()
            .format("kafka")
            .option("kafka.bootstrap.servers", "localhost:9092")
            .option("subscribe", "user_actions")
            .load()
            .selectExpr("CAST(value AS STRING) as value")
            .select(functions.from_json(functions.col("value"), schema).as("data"))
            .select("data.*");

        // 处理流式数据
        StreamingQuery query = streamData
            .writeStream()
            .outputMode("append")
            .format("console")
            .start();

        // 等待查询终止
        query.awaitTermination();
    }

    /**
     * 用户行为聚类分析
     * 基于用户的月均消费金额和购买频率进行聚类
     * 将用户分为不同的消费群体
     */
    public Map<String, Object> performUserBehaviorClustering(Dataset<Row> data) {
        try {
            logger.info("开始用户行为聚类分析，数据集schema: {}", data.schema().treeString());
            
            if (data == null || data.isEmpty()) {
                throw new IllegalArgumentException("用户行为数据不能为空");
            }
            
            // 创建特征向量
            VectorAssembler assembler = new VectorAssembler()
                .setInputCols(new String[]{"monthlySpending", "purchaseFrequency"})
                .setOutputCol("features");
                
            logger.debug("创建VectorAssembler");
            Dataset<Row> vectorData = assembler.transform(data);
            logger.debug("数据转换为特征向量完成");
            
            // 训练K-means模型
            KMeans kmeans = new KMeans()
                .setK(4)  // 设置聚类数为4，将用户分为4个群体
                .setSeed(1L)
                .setMaxIter(20)  // 设置最大迭代次数
                .setTol(1e-4);   // 设置收敛容差
                
            logger.debug("创建KMeans实例，k=4");
            KMeansModel model = kmeans.fit(vectorData);
            logger.info("KMeans模型训练完成");
            
            // 预测聚类结果
            Dataset<Row> predictions = model.transform(vectorData);
            logger.debug("完成聚类预测");
            
            // 计算每个簇的中心点
            Vector[] centers = model.clusterCenters();
            logger.debug("获取聚类中心点");
            
            // 收集结果
            Map<String, Object> result = new HashMap<>();
            
            // 将预测结果转换为可序列化的格式
            List<Map<String, Object>> predictionsList = new ArrayList<>();
            for (Row row : predictions.select("monthlySpending", "purchaseFrequency", "prediction").collectAsList()) {
                Map<String, Object> predictionMap = new HashMap<>();
                predictionMap.put("monthlySpending", row.getDouble(0));
                predictionMap.put("purchaseFrequency", row.getDouble(1));
                predictionMap.put("cluster", row.getInt(2));
                predictionsList.add(predictionMap);
            }
            result.put("predictions", predictionsList);
            logger.debug("收集{}个预测结果", predictionsList.size());
            
            // 将中心点转换为可序列化的格式
            List<Map<String, Double>> centersList = new ArrayList<>();
            for (Vector center : centers) {
                Map<String, Double> centerMap = new HashMap<>();
                centerMap.put("monthlySpending", center.apply(0));
                centerMap.put("purchaseFrequency", center.apply(1));
                centersList.add(centerMap);
            }
            result.put("centers", centersList);
            logger.debug("添加{}个聚类中心点", centersList.size());
            
            // 计算模型评估指标
            double cost = model.summary().trainingCost();
            result.put("cost", cost);
            logger.debug("模型代价: {}", cost);
            
            // 添加用户群体描述
            List<String> clusterDescriptions = new ArrayList<>();
            for (int i = 0; i < centersList.size(); i++) {
                Map<String, Double> center = centersList.get(i);
                String description = generateClusterDescription(i, center);
                clusterDescriptions.add(description);
            }
            result.put("clusterDescriptions", clusterDescriptions);
            
            logger.info("用户行为聚类分析完成");
            return result;
        } catch (Exception e) {
            logger.error("用户行为聚类分析过程中发生错误", e);
            throw new RuntimeException("用户行为聚类分析失败: " + e.getMessage(), e);
        }
    }

    /**
     * 生成用户群体的描述
     */
    private String generateClusterDescription(int clusterId, Map<String, Double> center) {
        double monthlySpending = center.get("monthlySpending");
        double purchaseFrequency = center.get("purchaseFrequency");
        
        StringBuilder description = new StringBuilder("用户群体" + clusterId + ": ");
        
        // 根据消费金额分类
        if (monthlySpending > 5000) {
            description.append("高消费");
        } else if (monthlySpending > 2000) {
            description.append("中高消费");
        } else if (monthlySpending > 1000) {
            description.append("中等消费");
        } else {
            description.append("低消费");
        }
        
        description.append("用户，");
        
        // 根据购买频率分类
        if (purchaseFrequency > 10) {
            description.append("高频购买");
        } else if (purchaseFrequency > 5) {
            description.append("中频购买");
        } else {
            description.append("低频购买");
        }
        
        description.append(String.format("（月均消费%.2f元，月均购买%.1f次）", 
            monthlySpending, purchaseFrequency));
        
        return description.toString();
    }
}