package com.example.sparkdemo.service;

import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.RowFactory;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.functions;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructField;
import org.apache.spark.sql.types.StructType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import scala.Tuple2;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class SparkService {

    @Autowired
    private SparkSession sparkSession;

    /**
     * 演示RDD基本操作 - 单词计数
     */
    public Map<String, Long> wordCount(String text) {
        // 创建schema
        StructType schema = new StructType(new StructField[]{
            DataTypes.createStructField("line", DataTypes.StringType, true)
        });
        
        // 创建DataFrame
        List<Row> rows = Arrays.asList(text.split("\n")).stream()
            .map(line -> RowFactory.create(line))
            .collect(java.util.stream.Collectors.toList());
            
        Dataset<Row> linesDF = sparkSession.createDataFrame(rows, schema);
        
        // 创建临时视图
        linesDF.createOrReplaceTempView("lines");
        
        // 使用SQL进行单词计数
        Dataset<Row> wordCounts = sparkSession.sql(
            "SELECT word, COUNT(*) as count " +
            "FROM (SELECT explode(split(line, ' ')) as word FROM lines) " +
            "WHERE word != '' " +
            "GROUP BY word"
        );
        
        // 将结果转换为Map
        return wordCounts.select("word", "count")
                .collectAsList()
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                    row -> row.getString(0),
                    row -> row.getLong(1)
                ));
    }

    /**
     * 演示Spark SQL操作 - 读取CSV文件并分析
     */
    public Dataset<Row> readCsvFile() throws IOException {
        try {
            // 直接使用相对路径
            String filePath = "src/main/resources/data/sample.csv";
            System.out.println("CSV文件路径: " + filePath);
            
            // 读取CSV文件
            Dataset<Row> df = sparkSession.read()
                    .option("header", "true") // 第一行为标题
                    .option("inferSchema", "true") // 自动推断数据类型
                    .csv(filePath);
            
            // 显示数据结构
            df.printSchema();
            
            // 返回数据集
            return df;
        } catch (Exception e) {
            System.err.println("读取CSV文件失败: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("无法读取CSV文件: " + e.getMessage(), e);
        }
    }

    /**
     * 演示Spark SQL操作 - 数据筛选
     */
    public Dataset<Row> filterData(Dataset<Row> df, int minAge) {
        // 查询年龄大于minAge的记录
        Dataset<Row> filteredDF = df.filter(df.col("age").gt(minAge));
        
        // 显示结果
        filteredDF.show();
        
        return filteredDF;
    }

    /**
     * 演示Spark SQL操作 - 数据聚合
     */
    public Dataset<Row> aggregateData(Dataset<Row> df) {
        // 按城市分组，计算平均年龄
        Dataset<Row> result = df.groupBy("city")
                .agg(org.apache.spark.sql.functions.avg("age").as("avg_age"))
                .orderBy("avg_age");
        
        // 显示结果
        result.show();
        
        return result;
    }
} 