package com.example.sparkdemo;

import com.example.sparkdemo.service.SparkAdvancedService;
import com.example.sparkdemo.util.TestDataGenerator;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class SparkAdvancedTest {

    @Autowired
    private SparkSession sparkSession;

    @Autowired
    private SparkAdvancedService sparkAdvancedService;

    @Test
    public void testKMeansClustering() {
        // 准备测试数据
        Dataset<Row> dataset = sparkSession.createDataFrame(
            TestDataGenerator.generateUserData(),
            TestDataGenerator.getUserSchema()
        );

        // 执行K-means聚类
        Map<String, Object> result = sparkAdvancedService.performKMeansClustering(dataset);

        // 验证结果
        assertNotNull(result);
        assertTrue(result.containsKey("predictions"));
        assertTrue(result.containsKey("centers"));
    }
} 