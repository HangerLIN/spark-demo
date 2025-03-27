package com.example.sparkdemo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * 模拟的SparkStreamingService实现，用于在Spark环境配置不正确时提供降级服务
 */
@Service
public class MockSparkStreamingService {
    private static final Logger logger = LoggerFactory.getLogger(MockSparkStreamingService.class);
    
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final Map<String, List<Double>> mockStats = new HashMap<>();
    private Timer updateTimer;
    private Random random = new Random();
    
    public void startStreaming(int timeWindowSeconds, double threshold) {
        logger.info("启动模拟流处理服务，时间窗口：{}秒，异常阈值：{}", timeWindowSeconds, threshold);
        
        if (isRunning.get()) {
            logger.info("模拟流处理已在运行中");
            return;
        }
        
        // 初始化模拟数据
        initializeData(threshold);
        
        // 启动定时更新
        startPeriodicUpdates(threshold);
        
        isRunning.set(true);
        logger.info("模拟流处理服务启动成功");
    }
    
    public Map<String, Object> getStreamingStats() {
        logger.debug("获取模拟流处理统计数据");
        Map<String, Object> result = new HashMap<>();
        
        if (!isRunning.get()) {
            logger.debug("模拟流处理未运行，返回未运行状态");
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
            result.put("totalUsers", mockStats.getOrDefault("totalUsers", Collections.singletonList(0.0)).get(0));
            result.put("avgSpending", mockStats.getOrDefault("avgSpending", Collections.singletonList(0.0)).get(0));
            result.put("totalTransactions", mockStats.getOrDefault("totalTransactions", Collections.singletonList(0.0)).get(0));
            result.put("anomalyCount", mockStats.getOrDefault("anomalyCount", Collections.singletonList(0.0)).get(0));

            // 添加趋势数据
            List<Map<String, Object>> spendingTrend = new ArrayList<>();
            List<Map<String, Object>> frequencyTrend = new ArrayList<>();

            List<Double> amounts = mockStats.getOrDefault("spendingTrend", new ArrayList<>());
            List<Double> frequencies = mockStats.getOrDefault("frequencyTrend", new ArrayList<>());
            List<Double> anomalies = mockStats.getOrDefault("anomalies", new ArrayList<>());

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
            
            logger.debug("返回模拟统计数据：总记录数={}, 趋势数据点数={}", result.size(), spendingTrend.size());
        } catch (Exception e) {
            logger.error("获取模拟统计数据时发生错误", e);
            result.put("error", "获取统计数据失败：" + e.getMessage());
            result.put("status", "错误");
        }

        return result;
    }
    
    public void stopStreaming() {
        logger.info("停止模拟流处理服务");
        
        if (updateTimer != null) {
            updateTimer.cancel();
            updateTimer = null;
        }
        
        isRunning.set(false);
        // 清空数据
        mockStats.clear();
        logger.info("模拟流处理服务已停止");
    }
    
    private void initializeData(double threshold) {
        List<Double> spendingTrend = new ArrayList<>();
        List<Double> frequencyTrend = new ArrayList<>();
        List<Boolean> anomalies = new ArrayList<>();
        
        for (int i = 0; i < 20; i++) {
            double amount = 100 + random.nextDouble() * 900;
            spendingTrend.add(amount);
            frequencyTrend.add(1.0 + random.nextDouble() * 5);
            anomalies.add(amount > threshold);
        }
        
        // 计算基本统计量
        double totalAmount = spendingTrend.stream().mapToDouble(Double::doubleValue).sum();
        double avgAmount = totalAmount / spendingTrend.size();
        int totalTransactions = spendingTrend.size();
        long anomalyCount = anomalies.stream().filter(a -> a).count();
        
        mockStats.put("avgSpending", Collections.singletonList(avgAmount));
        mockStats.put("totalTransactions", Collections.singletonList((double) totalTransactions));
        mockStats.put("totalUsers", Collections.singletonList(5.0));
        mockStats.put("anomalyCount", Collections.singletonList((double) anomalyCount));
        mockStats.put("spendingTrend", spendingTrend);
        mockStats.put("frequencyTrend", frequencyTrend);
        mockStats.put("anomalies", anomalies.stream()
            .map(a -> a ? 1.0 : 0.0)
            .collect(Collectors.toList()));
            
        logger.info("初始化模拟数据完成");
    }
    
    private void startPeriodicUpdates(double threshold) {
        updateTimer = new Timer(true);
        updateTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                try {
                    updateMockData(threshold);
                } catch (Exception e) {
                    logger.error("更新模拟数据时发生错误", e);
                }
            }
        }, 2000, 2000); // 每2秒更新一次
        
        logger.info("开始周期性更新模拟数据");
    }
    
    private void updateMockData(double threshold) {
        if (!isRunning.get()) {
            return;
        }
        
        List<Double> spendingTrend = mockStats.getOrDefault("spendingTrend", new ArrayList<>());
        List<Double> frequencyTrend = mockStats.getOrDefault("frequencyTrend", new ArrayList<>());
        List<Double> anomalies = mockStats.getOrDefault("anomalies", new ArrayList<>());
        
        // 移除旧数据点，保持最多20个点
        while (spendingTrend.size() >= 20) {
            spendingTrend.remove(0);
            frequencyTrend.remove(0);
            anomalies.remove(0);
        }
        
        // 添加新数据点
        double newAmount = 100 + random.nextDouble() * 900;
        double newFrequency = 1.0 + random.nextDouble() * 5;
        boolean isAnomaly = newAmount > threshold;
        
        spendingTrend.add(newAmount);
        frequencyTrend.add(newFrequency);
        anomalies.add(isAnomaly ? 1.0 : 0.0);
        
        // 更新基本统计信息
        double totalAmount = spendingTrend.stream().mapToDouble(Double::doubleValue).sum();
        double avgAmount = totalAmount / spendingTrend.size();
        int totalTransactions = spendingTrend.size();
        long anomalyCount = anomalies.stream().filter(a -> a > 0).count();
        
        mockStats.put("avgSpending", Collections.singletonList(avgAmount));
        mockStats.put("totalTransactions", Collections.singletonList((double) totalTransactions));
        // 随机波动的用户数
        mockStats.put("totalUsers", Collections.singletonList(3.0 + random.nextDouble() * 4));
        mockStats.put("anomalyCount", Collections.singletonList((double) anomalyCount));
        mockStats.put("spendingTrend", spendingTrend);
        mockStats.put("frequencyTrend", frequencyTrend);
        mockStats.put("anomalies", anomalies);
        
        logger.debug("更新模拟数据完成");
    }
} 