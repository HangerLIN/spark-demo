package com.example.sparkdemo.util;

import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.RowFactory;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructField;
import org.apache.spark.sql.types.StructType;

import java.util.Arrays;
import java.util.List;

public class TestDataGenerator {
    
    public static Dataset<Row> createUserDataset(SparkSession spark) {
        // 创建用户数据schema
        StructType userSchema = new StructType()
            .add("id", DataTypes.IntegerType)
            .add("name", DataTypes.StringType)
            .add("age", DataTypes.IntegerType)
            .add("income", DataTypes.DoubleType);

        // 创建用户数据
        List<Row> userRows = Arrays.asList(
            RowFactory.create(1, "张三", 25, 50000.0),
            RowFactory.create(2, "李四", 35, 80000.0),
            RowFactory.create(3, "王五", 45, 120000.0),
            RowFactory.create(4, "赵六", 30, 65000.0),
            RowFactory.create(5, "钱七", 40, 95000.0)
        );

        return spark.createDataFrame(userRows, userSchema);
    }

    public static Dataset<Row> createRelationshipDataset(SparkSession spark) {
        // 创建关系数据schema
        StructType relationshipSchema = new StructType()
            .add("sourceId", DataTypes.IntegerType)
            .add("targetId", DataTypes.IntegerType)
            .add("relationship", DataTypes.StringType);

        // 创建关系数据
        List<Row> relationshipRows = Arrays.asList(
            RowFactory.create(1, 2, "朋友"),
            RowFactory.create(2, 3, "同事"),
            RowFactory.create(1, 3, "同学"),
            RowFactory.create(3, 4, "朋友"),
            RowFactory.create(4, 5, "同事")
        );

        return spark.createDataFrame(relationshipRows, relationshipSchema);
    }

    public static List<Row> generateUserData() {
        return Arrays.asList(
            RowFactory.create(1.0, 2.0),
            RowFactory.create(1.5, 1.8),
            RowFactory.create(5.0, 6.0),
            RowFactory.create(5.2, 5.8),
            RowFactory.create(9.0, 10.0)
        );
    }

    public static StructType getUserSchema() {
        return new StructType()
            .add("feature1", DataTypes.DoubleType)
            .add("feature2", DataTypes.DoubleType);
    }
} 