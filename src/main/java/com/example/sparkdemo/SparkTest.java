package com.example.sparkdemo;

import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import scala.Tuple2;

import java.io.File;
import java.util.Arrays;
import java.util.Map;

public class SparkTest {

    public static void main(String[] args) {
        // 创建Spark配置
        SparkConf sparkConf = new SparkConf()
                .setAppName("Spark Test")
                .setMaster("local[*]");

        // 创建JavaSparkContext
        JavaSparkContext jsc = new JavaSparkContext(sparkConf);

        // 创建SparkSession
        SparkSession spark = SparkSession.builder()
                .config(sparkConf)
                .getOrCreate();

        System.out.println("=== 测试1：执行词频统计 ===");
        testWordCount(jsc);

        System.out.println("\n=== 测试2：读取CSV文件 ===");
        testReadCsv(spark);

        System.out.println("\n=== 测试3：数据过滤 ===");
        testFilter(spark);

        System.out.println("\n=== 测试4：数据聚合 ===");
        testAggregation(spark);

        // 关闭资源
        jsc.close();
        spark.close();
    }

    private static void testWordCount(JavaSparkContext jsc) {
        // 创建测试数据
        String text = "这是一段测试文本 用于测试Spark词频统计功能 这是一段文本 Spark真的很强大";
        JavaRDD<String> lines = jsc.parallelize(Arrays.asList(text.split("\n")));
        
        // 按空格分割每行，然后展平
        JavaRDD<String> words = lines.flatMap(line -> Arrays.asList(line.split(" ")).iterator());
        
        // 过滤空字符串
        JavaRDD<String> nonEmptyWords = words.filter(word -> !word.isEmpty());
        
        // 将每个单词映射为 (word, 1) 的键值对，再按key分组聚合
        JavaPairRDD<String, Long> counts = nonEmptyWords
                .mapToPair(word -> new Tuple2<>(word, 1L))
                .reduceByKey((a, b) -> a + b);
        
        // 打印结果
        Map<String, Long> wordCounts = counts.collectAsMap();
        System.out.println("词频统计结果：");
        wordCounts.forEach((word, count) -> System.out.println(word + ": " + count));
        System.out.println("总单词数：" + wordCounts.values().stream().mapToLong(Long::longValue).sum());
        System.out.println("不同单词数：" + wordCounts.size());
    }

    private static void testReadCsv(SparkSession spark) {
        try {
            // 获取CSV文件路径
            String projectDir = System.getProperty("user.dir");
            String filePath = projectDir + "/src/main/resources/data/sample.csv";
            
            // 读取CSV文件
            Dataset<Row> df = spark.read()
                    .option("header", "true") // 第一行为标题
                    .option("inferSchema", "true") // 自动推断数据类型
                    .csv(filePath);
            
            // 显示数据结构
            System.out.println("CSV文件结构：");
            df.printSchema();
            
            // 显示数据
            System.out.println("CSV数据内容：");
            df.show();
            
        } catch (Exception e) {
            System.err.println("读取CSV文件失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void testFilter(SparkSession spark) {
        try {
            // 获取CSV文件路径
            String projectDir = System.getProperty("user.dir");
            String filePath = projectDir + "/src/main/resources/data/sample.csv";
            
            // 读取CSV文件
            Dataset<Row> df = spark.read()
                    .option("header", "true") // 第一行为标题
                    .option("inferSchema", "true") // 自动推断数据类型
                    .csv(filePath);
            
            // 过滤年龄大于30的记录
            Dataset<Row> filteredDF = df.filter(df.col("age").gt(30));
            
            // 显示过滤后的数据
            System.out.println("年龄大于30的用户：");
            filteredDF.show();
            System.out.println("符合条件的记录数：" + filteredDF.count());
            
        } catch (Exception e) {
            System.err.println("过滤数据失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void testAggregation(SparkSession spark) {
        try {
            // 获取CSV文件路径
            String projectDir = System.getProperty("user.dir");
            String filePath = projectDir + "/src/main/resources/data/sample.csv";
            
            // 读取CSV文件
            Dataset<Row> df = spark.read()
                    .option("header", "true") // 第一行为标题
                    .option("inferSchema", "true") // 自动推断数据类型
                    .csv(filePath);
            
            // 按城市分组，计算平均年龄
            Dataset<Row> result = df.groupBy("city")
                    .agg(org.apache.spark.sql.functions.avg("age").as("avg_age"))
                    .orderBy("avg_age");
            
            // 显示结果
            System.out.println("城市平均年龄统计：");
            result.show();
            
        } catch (Exception e) {
            System.err.println("数据聚合失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 