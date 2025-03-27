# Spring Boot 集成 Spark 项目详细文档

## 项目概述

本项目是一个基于Spring Boot与Apache Spark集成的大数据处理应用，实现了Spark的多种核心功能，包括离线数据处理、机器学习、图计算和实时流处理。项目通过RESTful API接口提供服务，可用于数据分析、用户聚类、关系网络分析和实时数据监控等场景。

## 技术架构

- **后端框架**：Spring Boot 2.7.13
- **大数据处理**：Apache Spark 3.3.2 (Scala 2.12)
- **组件集成**：
  - Spark Core: RDD基础操作
  - Spark SQL: 结构化数据处理
  - Spark ML: 机器学习算法
  - Spark Streaming: 实时数据处理
- **API接口**: RESTful风格
- **数据序列化**: Jackson 2.13.5

## 系统功能模块

### 1. 基础数据处理模块

- RDD创建和操作
- 词频统计
- CSV数据读取和分析
- 聚合统计

### 2. 机器学习模块

- K-means聚类分析
- 用户行为分群
- 特征向量化

### 3. 图计算模块

- 用户关系网络分析
- 商品关联分析
- 社区发现

### 4. 实时流处理模块

- 数据流模拟
- 实时数据分析
- 异常检测
- 统计指标计算

## API接口说明

### 基础功能接口

#### 1. 词频统计接口

- **URL**: `/api/spark/wordcount`
- **方法**: `POST`
- **描述**: 使用Spark RDD进行文本词频统计
- **请求体**: 纯文本内容
- **响应格式**:
```json
{
    "result": {"词1": 数量1, "词2": 数量2, ...},
    "totalWords": 总词数,
    "uniqueWords": 不同词数量
}
```
- **实现类**: `SparkService.performWordCount()`

#### 2. CSV数据分析接口

- **URL**: `/api/spark/analyze-csv`
- **方法**: `GET`
- **描述**: 读取CSV文件并进行数据分析
- **响应格式**:
```json
{
    "status": "success",
    "totalRecords": 记录总数,
    "filteredRecords": 过滤后记录数
}
```
- **实现类**: `SparkService.analyzeCSV()`

### 高级功能接口

#### 1. K-means聚类分析接口

- **URL**: `/api/advanced/kmeans`
- **方法**: `POST`
- **描述**: 对用户数据进行K-means聚类
- **请求体**: 包含用户特征的JSON数组
- **响应格式**:
```json
{
    "predictions": [聚类结果数组],
    "centers": [聚类中心点],
    "cost": 代价函数值
}
```
- **实现类**: `SparkAdvancedService.performKMeansClustering()`

#### 2. 用户网络分析接口

- **URL**: `/api/advanced/network/users`
- **方法**: `GET`
- **描述**: 分析用户关系网络
- **响应格式**:
```json
{
    "vertices": [用户节点数组],
    "edges": [关系边数组]
}
```
- **实现类**: `SparkGraphService.analyzeUserNetwork()`

#### 3. 实时流处理接口

- **URL**: `/api/advanced/start-streaming`
- **方法**: `POST`
- **参数**:
  - `timeWindow`: 时间窗口(秒)
  - `threshold`: 异常检测阈值
- **描述**: 启动实时数据流处理
- **响应格式**:
```json
{
    "message": "流处理已启动",
    "status": "success",
    "timeWindow": 时间窗口,
    "threshold": 阈值
}
```
- **实现类**: `SparkStreamingService.startStreaming()`

- **获取统计数据**:
  - **URL**: `/api/advanced/streaming-stats`
  - **方法**: `GET`
  - **响应**: 包含各种统计指标的JSON对象

## Spark核心知识点应用

### 1. RDD (弹性分布式数据集)

- **使用场景**: 词频统计
- **核心代码**:
```java
// 创建RDD
JavaRDD<String> linesRDD = javaSparkContext.parallelize(Arrays.asList(text.split("\n")));

// 转换操作
JavaRDD<String> wordsRDD = linesRDD.flatMap(line -> Arrays.asList(line.split("\\s+")).iterator());

// 映射为键值对
JavaPairRDD<String, Integer> wordPairs = wordsRDD.mapToPair(word -> new Tuple2<>(word, 1));

// 聚合操作
JavaPairRDD<String, Integer> wordCounts = wordPairs.reduceByKey((a, b) -> a + b);

// 收集结果
Map<String, Integer> result = wordCounts.collectAsMap();
```

### 2. DataFrame和SparkSQL

- **使用场景**: CSV数据分析
- **核心代码**:
```java
// 读取CSV创建DataFrame
Dataset<Row> df = sparkSession
    .read()
    .option("header", "true")
    .option("inferSchema", "true")
    .csv("path/to/data.csv");

// SQL查询
Dataset<Row> filteredDF = df.filter(col("age").gt(30));
Dataset<Row> aggregatedDF = filteredDF.groupBy("city").agg(avg("age").as("avgAge"));

// 结果转换
List<Row> results = aggregatedDF.orderBy(desc("avgAge")).collectAsList();
```

### 3. Spark ML

- **使用场景**: K-means聚类
- **核心代码**:
```java
// 特征向量化
VectorAssembler assembler = new VectorAssembler()
    .setInputCols(new String[]{"feature1", "feature2"})
    .setOutputCol("features");
Dataset<Row> vectorData = assembler.transform(data);

// 训练K-means模型
KMeans kmeans = new KMeans()
    .setK(3)
    .setSeed(1L)
    .setMaxIter(20);
KMeansModel model = kmeans.fit(vectorData);

// 预测结果
Dataset<Row> predictions = model.transform(vectorData);
```

### 4. Spark Streaming

- **使用场景**: 实时数据处理
- **核心代码**:
```java
// 创建StreamingContext
JavaStreamingContext streamingContext = new JavaStreamingContext(
    javaSparkContext, new Duration(1000));

// 创建DStream
JavaDStream<Transaction> stream = streamingContext.receiverStream(
    new SimulatedTransactionReceiver());

// 窗口操作
JavaDStream<Transaction> windowedTransactions = stream.window(
    new Duration(timeWindow * 1000),
    new Duration(1000)
);

// 处理数据
windowedTransactions.foreachRDD(rdd -> {
    // 计算统计指标
    List<Transaction> transactions = rdd.collect();
    double avgAmount = transactions.stream()
        .mapToDouble(Transaction::getAmount)
        .average()
        .orElse(0);
    // 更新统计结果
});

// 启动流处理
streamingContext.start();
```

## 流处理数据链路

1. **数据源** → 通过自定义Receiver(SimulatedTransactionReceiver)生成模拟交易数据
2. **数据接收** → JavaStreamingContext创建接收器流(DStream)
3. **窗口处理** → 使用window()方法创建滑动窗口
4. **数据分析** → foreachRDD处理每个微批次数据
5. **异常检测** → 根据阈值判断异常交易
6. **统计计算** → 计算平均值、总数、趋势等指标
7. **状态存储** → 将统计结果保存在内存中
8. **结果获取** → 通过API接口返回处理结果

## 故障恢复机制

系统实现了故障恢复和优雅降级机制：

1. **SparkContext检测**: 启动前检查SparkContext是否可用
2. **资源清理**: 异常时自动清理Spark Streaming资源
3. **模拟数据模式**: 当Spark不可用时自动切换到模拟数据模式
4. **异常处理**: 全面的异常捕获和日志记录

## 部署和运行

### 环境要求

- JDK 11+
- Maven 3.6+
- Spark 3.3.2

### 启动步骤

1. 克隆项目
```bash
git clone https://github.com/yourusername/spark-springboot-demo.git
cd spark-springboot-demo
```

2. 编译项目
```bash
mvn clean package
```

3. 运行应用
```bash
./start.sh
```

4. 访问API
```
http://localhost:8088/api/...
```

## 核心文件说明

- `SparkService.java`: 基础Spark操作服务
- `SparkAdvancedService.java`: 高级分析和机器学习服务
- `SparkGraphService.java`: 图计算服务
- `SparkStreamingService.java`: 实时流处理服务
- `SparkStreamingController.java`: 流处理REST控制器
- `SparkConfig.java`: Spark配置类

## 示例调用

### 启动流处理

```bash
curl -X POST "http://localhost:8088/api/advanced/start-streaming?timeWindow=60&threshold=1000"
```

### 获取统计数据

```bash
curl -X GET "http://localhost:8088/api/advanced/streaming-stats"
```

## 总结

本项目全面展示了Spark与Spring Boot的集成应用，涵盖了Spark的多种核心功能组件，适合作为大数据处理项目的基础框架。系统不仅实现了基础的数据处理功能，还提供了机器学习、图计算和实时流处理等高级特性，通过RESTful API提供了便捷的接口调用方式。 