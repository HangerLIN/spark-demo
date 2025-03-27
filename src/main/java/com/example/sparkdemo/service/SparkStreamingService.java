package com.example.sparkdemo.service;

import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.streaming.Duration;
import org.apache.spark.streaming.StreamingContextState;
import org.apache.spark.streaming.api.java.JavaDStream;
import org.apache.spark.streaming.api.java.JavaStreamingContext;
import org.apache.spark.api.java.function.Function;
import org.apache.spark.api.java.function.Function2;
import org.apache.spark.api.java.function.PairFunction;
import org.apache.spark.mllib.linalg.Vector;
import org.apache.spark.mllib.linalg.Vectors;
import org.apache.spark.mllib.stat.MultivariateStatisticalSummary;
import org.apache.spark.mllib.stat.Statistics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import scala.Tuple2;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import com.example.sparkdemo.model.Transaction;
import com.example.sparkdemo.receiver.SimulatedTransactionReceiver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 使用Spark Streaming进行实时流处理的服务，用于分析交易数据和检测异常
 */
@Service
public class SparkStreamingService {
    private static final Logger logger = LoggerFactory.getLogger(SparkStreamingService.class);
    
    // 只注入JavaSparkContext
    @Autowired
    private JavaSparkContext javaSparkContext;
    
    private JavaStreamingContext streamingContext;
    private final AtomicBoolean isStreaming = new AtomicBoolean(false);
    private Map<String, List<Double>> streamingStats = new HashMap<>();
    private int timeWindow;
    private double anomalyThreshold;

    /**
     * 启动流处理服务
     * @param timeWindowSeconds 时间窗口（秒）
     * @param threshold 异常检测阈值
     */
    public void startStreaming(int timeWindowSeconds, double threshold) {
        logger.info("开始启动流处理，时间窗口：{}秒，异常阈值：{}", timeWindowSeconds, threshold);
        
        if (isStreaming.get()) {
            logger.info("流处理已经在运行中，不需要重新启动");
            return;
        }

        this.timeWindow = timeWindowSeconds;
        this.anomalyThreshold = threshold;

        try {
            // 检查SparkContext是否可用
            if (javaSparkContext == null || javaSparkContext.sc().isStopped()) {
                logger.error("JavaSparkContext不可用或已停止，无法启动流处理");
                throw new IllegalStateException("JavaSparkContext不可用或已停止");
            }
            
            // 每次启动时创建新的JavaStreamingContext
            logger.info("使用JavaSparkContext创建新的StreamingContext，SparkContext状态：{}", 
                    javaSparkContext.sc().isStopped() ? "已停止" : "运行中");
            
            // 确保之前的StreamingContext已停止
            if (streamingContext != null) {
                try {
                    if (!streamingContext.getState().equals(StreamingContextState.STOPPED)) {
                        logger.info("停止之前的StreamingContext");
                        streamingContext.stop(true, true);
                    }
                } catch (Exception e) {
                    logger.warn("停止之前的StreamingContext时出现异常", e);
                } finally {
                    streamingContext = null;
                }
            }
            
            // 创建新的StreamingContext
            streamingContext = new JavaStreamingContext(javaSparkContext, new Duration(1000));
            logger.info("新的JavaStreamingContext创建成功");

            // 创建模拟数据流
            logger.info("创建模拟交易数据接收器");
            SimulatedTransactionReceiver receiver = new SimulatedTransactionReceiver();
            JavaDStream<Transaction> stream = streamingContext.receiverStream(receiver);
            logger.info("模拟数据流创建成功");

            // 处理数据流
            logger.info("开始设置数据流处理逻辑");
            processStream(stream);

            // 启动流处理
            logger.info("启动Spark Streaming上下文");
            streamingContext.start();
            isStreaming.set(true);
            logger.info("流处理启动成功");
            
            // 初始化示例数据，以便前端可以立即看到一些数据
            initializeExampleData();
        } catch (Exception e) {
            logger.error("启动流处理失败", e);
            // 如果启动失败，确保资源被释放
            cleanupResources();
            
            // 如果是SparkContext已停止的异常，尝试回退到模拟服务
            if (e instanceof IllegalStateException || (e.getCause() != null && e.getCause() instanceof IllegalStateException)) {
                logger.info("检测到SparkContext异常，回退到模拟数据模式");
                useMockData();
                throw new RuntimeException("启动流处理失败: " + e.getMessage() + " (已回退到模拟数据模式)", e);
            } else {
                // 重新抛出异常，让调用者知道发生了错误
                throw new RuntimeException("启动流处理失败: " + e.getMessage(), e);
            }
        }
    }

    // 使用模拟数据
    private void useMockData() {
        try {
            // 初始化模拟数据
            initializeExampleData();
            isStreaming.set(true);
            logger.info("已切换到模拟数据模式");
        } catch (Exception e) {
            logger.error("初始化模拟数据失败", e);
        }
    }
    
    // 初始化一些示例数据，以便前端可以立即看到一些内容
    private void initializeExampleData() {
        List<Double> spendingTrend = new ArrayList<>();
        List<Double> frequencyTrend = new ArrayList<>();
        List<Boolean> anomalies = new ArrayList<>();
        
        Random random = new Random();
        for (int i = 0; i < 10; i++) {
            double amount = 100 + random.nextDouble() * 900;
            spendingTrend.add(amount);
            frequencyTrend.add(1.0 + random.nextDouble() * 5);
            anomalies.add(amount > anomalyThreshold);
        }
        
        streamingStats.put("avgSpending", Collections.singletonList(500.0));
        streamingStats.put("totalTransactions", Collections.singletonList(10.0));
        streamingStats.put("totalUsers", Collections.singletonList(5.0));
        streamingStats.put("anomalyCount", Collections.singletonList(2.0));
        streamingStats.put("spendingTrend", spendingTrend);
        streamingStats.put("frequencyTrend", frequencyTrend);
        streamingStats.put("anomalies", anomalies.stream()
            .map(a -> a ? 1.0 : 0.0)
            .collect(Collectors.toList()));
            
        logger.info("初始化示例数据完成");
    }

    /**
     * 处理数据流
     * @param stream 交易数据流
     */
    private void processStream(JavaDStream<Transaction> stream) {
        try {
            // 计算滑动窗口统计
            logger.info("设置滑动窗口：{}秒", timeWindow);
            JavaDStream<Transaction> windowedTransactions = stream.window(
                new Duration(timeWindow * 1000),
                new Duration(1000)
            );

            // 计算实时统计指标
            windowedTransactions.foreachRDD(rdd -> {
                try {
                    if (!rdd.isEmpty()) {
                        logger.debug("处理新的RDD，分区数：{}", rdd.getNumPartitions());
                        
                        // 计算基本统计量
                        List<Transaction> transactionsList = rdd.collect();
                        logger.debug("收集到{}条交易记录", transactionsList.size());
                        
                        if (transactionsList.isEmpty()) {
                            logger.debug("没有交易记录，跳过统计计算");
                            return;
                        }
                        
                        double totalAmount = transactionsList.stream()
                            .mapToDouble(Transaction::getAmount)
                            .sum();
                        double avgAmount = totalAmount / transactionsList.size();
                        int totalTransactions = transactionsList.size();
                        long uniqueUsers = transactionsList.stream()
                            .map(Transaction::getUserId)
                            .distinct()
                            .count();

                        // 检测异常交易
                        int anomalyCount = (int) transactionsList.stream()
                            .filter(t -> t.getAmount() > anomalyThreshold)
                            .count();

                        logger.debug("统计结果：平均金额={}, 总交易数={}, 唯一用户数={}, 异常交易数={}",
                                avgAmount, totalTransactions, uniqueUsers, anomalyCount);
                                
                        // 更新统计信息
                        updateStats(avgAmount, totalTransactions, uniqueUsers, anomalyCount);

                        // 计算趋势数据
                        calculateTrends(transactionsList);
                    } else {
                        logger.debug("RDD为空，跳过处理");
                    }
                } catch (Exception e) {
                    logger.error("处理RDD时发生错误", e);
                }
            });
            
            logger.info("数据流处理逻辑设置完成");
        } catch (Exception e) {
            logger.error("设置数据流处理时发生错误", e);
            throw e;
        }
    }

    /**
     * 更新流统计数据
     */
    private void updateStats(double avgAmount, int totalTransactions, long uniqueUsers, int anomalyCount) {
        streamingStats.put("avgSpending", Collections.singletonList(avgAmount));
        streamingStats.put("totalTransactions", Collections.singletonList((double) totalTransactions));
        streamingStats.put("totalUsers", Collections.singletonList((double) uniqueUsers));
        streamingStats.put("anomalyCount", Collections.singletonList((double) anomalyCount));
        logger.debug("更新统计信息完成");
    }

    /**
     * 计算消费趋势
     */
    private void calculateTrends(List<Transaction> transactions) {
        try {
            // 按时间排序 - 注意：这里可能会导致UnsupportedOperationException
            // 创建一个新的可修改的List来避免这个问题
            List<Transaction> sortableTransactions = new ArrayList<>(transactions);
            sortableTransactions.sort(Comparator.comparing(Transaction::getTimestamp));

            // 计算消费金额趋势
            List<Double> spendingTrend = new ArrayList<>();
            List<Double> frequencyTrend = new ArrayList<>();
            List<Boolean> anomalies = new ArrayList<>();

            // 计算每个用户的交易频率
            Map<String, Integer> userFrequency = new HashMap<>();
            for (Transaction t : sortableTransactions) {
                String userId = t.getUserId();
                userFrequency.put(userId, userFrequency.getOrDefault(userId, 0) + 1);
            }

            // 如果数据点过多，进行抽样或聚合
            int maxDataPoints = 20; // 最多20个数据点
            int step = Math.max(1, sortableTransactions.size() / maxDataPoints);
            
            for (int i = 0; i < sortableTransactions.size(); i += step) {
                Transaction t = sortableTransactions.get(i);
                spendingTrend.add(t.getAmount());
                frequencyTrend.add((double) userFrequency.getOrDefault(t.getUserId(), 0));
                anomalies.add(t.getAmount() > anomalyThreshold);
                
                if (spendingTrend.size() >= maxDataPoints) break;
            }

            // 更新趋势数据
            streamingStats.put("spendingTrend", spendingTrend);
            streamingStats.put("frequencyTrend", frequencyTrend);
            streamingStats.put("anomalies", anomalies.stream()
                .map(a -> a ? 1.0 : 0.0)
                .collect(Collectors.toList()));
                
            logger.debug("更新趋势数据完成：{}个数据点", spendingTrend.size());
        } catch (Exception e) {
            logger.error("计算趋势数据时发生错误", e);
        }
    }

    /**
     * 停止流处理服务
     */
    public void stopStreaming() {
        logger.info("停止流处理");
        
        if (isStreaming.get()) {
            cleanupResources();
            logger.info("流处理已停止");
        } else {
            logger.info("流处理未运行，无需停止");
        }
    }
    
    /**
     * 清理资源
     */
    private void cleanupResources() {
        try {
            // 停止StreamingContext
            if (streamingContext != null) {
                try {
                    logger.info("停止JavaStreamingContext");
                    streamingContext.stop(true, true);
                } catch (Exception e) {
                    logger.error("停止JavaStreamingContext时出现异常", e);
                } finally {
                    streamingContext = null;
                }
            }
            
            isStreaming.set(false);
            
            // 清除统计数据
            streamingStats.clear();
            
            logger.info("流处理资源已清理");
        } catch (Exception e) {
            logger.error("停止流处理资源时发生错误", e);
        }
    }
    
    /**
     * 获取流处理统计数据
     * @return 统计数据
     */
    public Map<String, Object> getStreamingStats() {
        logger.debug("获取流处理统计数据");
        Map<String, Object> result = new HashMap<>();
        
        if (!isStreaming.get()) {
            logger.debug("流处理未运行，返回未运行状态");
            result.put("status", "未运行");
            result.put("message", "流处理服务未启动，请先启动服务");
            // 清空统计数据
            result.put("totalUsers", 0.0);
            result.put("avgSpending", 0.0);
            result.put("totalTransactions", 0.0);
            result.put("anomalyCount", 0.0);
            result.put("spendingTrend", new ArrayList<>());
            result.put("frequencyTrend", new ArrayList<>());
            return result;
        }
        
        try {
            // 添加基本统计指标
            result.put("totalUsers", streamingStats.getOrDefault("totalUsers", Collections.singletonList(0.0)).get(0));
            result.put("avgSpending", streamingStats.getOrDefault("avgSpending", Collections.singletonList(0.0)).get(0));
            result.put("totalTransactions", streamingStats.getOrDefault("totalTransactions", Collections.singletonList(0.0)).get(0));
            result.put("anomalyCount", streamingStats.getOrDefault("anomalyCount", Collections.singletonList(0.0)).get(0));

            // 添加趋势数据
            List<Map<String, Object>> spendingTrend = new ArrayList<>();
            List<Map<String, Object>> frequencyTrend = new ArrayList<>();

            List<Double> amounts = streamingStats.getOrDefault("spendingTrend", new ArrayList<>());
            List<Double> frequencies = streamingStats.getOrDefault("frequencyTrend", new ArrayList<>());
            List<Double> anomalies = streamingStats.getOrDefault("anomalies", new ArrayList<>());

            int size = Math.min(amounts.size(), Math.min(frequencies.size(), anomalies.size()));
            for (int i = 0; i < size; i++) {
                spendingTrend.add(Map.of(
                    "value", amounts.get(i),
                    "isAnomaly", anomalies.get(i) > 0
                ));
                frequencyTrend.add(Map.of(
                    "value", frequencies.get(i),
                    "isAnomaly", anomalies.get(i) > 0
                ));
            }

            result.put("spendingTrend", spendingTrend);
            result.put("frequencyTrend", frequencyTrend);
            result.put("status", "运行中");
            
            logger.debug("返回统计数据：总记录数={}, 趋势数据点数={}", result.size(), spendingTrend.size());
        } catch (Exception e) {
            logger.error("获取统计数据时发生错误", e);
            result.put("error", "获取统计数据失败：" + e.getMessage());
            result.put("status", "错误");
        }

        return result;
    }
} 