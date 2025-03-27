package com.example.sparkdemo.config;

import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.streaming.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SparkConfig {

    @Bean
    public SparkConf sparkConf() {
        return new SparkConf()
                .setAppName("SparkDemo")
                .setMaster("local[*]")
                .set("spark.driver.allowMultipleContexts", "true")
                .set("spark.streaming.stopGracefullyOnShutdown", "true")
                .set("spark.driver.allowMultipleContexts", "true")
                .set("spark.ui.enabled", "false") // 禁用UI避免端口冲突
                .set("spark.executor.instances", "1")
                .set("spark.driver.memory", "1g");
    }

    @Bean
    public SparkSession sparkSession(SparkConf sparkConf) {
        return SparkSession.builder()
                .config(sparkConf)
                .getOrCreate();
    }
    
    @Bean
    public JavaSparkContext javaSparkContext(SparkSession sparkSession) {
        // 从SparkSession获取JavaSparkContext，避免创建多个SparkContext
        return JavaSparkContext.fromSparkContext(sparkSession.sparkContext());
    }
}