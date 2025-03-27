package com.example.sparkdemo.controller;

import com.example.sparkdemo.service.SparkService;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/spark")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SparkDemoController {

    @Autowired
    private SparkService sparkService;

    /**
     * 演示词频统计
     */
    @PostMapping("/wordcount")
    public ResponseEntity<Map<String, Object>> wordCount(@RequestBody String text) {
        Map<String, Long> wordCount = sparkService.wordCount(text);
        
        Map<String, Object> response = new HashMap<>();
        response.put("result", wordCount);
        response.put("totalWords", wordCount.values().stream().mapToLong(Long::longValue).sum());
        response.put("uniqueWords", wordCount.size());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 演示CSV数据分析
     */
    @GetMapping("/analyze-csv")
    public ResponseEntity<Map<String, Object>> analyzeCSV() {
        try {
            // 读取CSV数据
            Dataset<Row> df = sparkService.readCsvFile();
            
            // 过滤数据-年龄大于30的用户
            Dataset<Row> filteredDF = sparkService.filterData(df, 30);
            
            // 聚合数据-按城市分组计算平均年龄
            Dataset<Row> aggregatedDF = sparkService.aggregateData(df);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("totalRecords", df.count());
            response.put("filteredRecords", filteredDF.count());
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "无法读取CSV文件: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * 获取城市平均年龄数据
     */
    @GetMapping("/city-age-stats")
    public ResponseEntity<Map<String, Object>> getCityAgeStats() {
        try {
            // 读取CSV数据
            Dataset<Row> df = sparkService.readCsvFile();
            
            // 聚合数据-按城市分组计算平均年龄
            Dataset<Row> aggregatedDF = sparkService.aggregateData(df);
            
            // 将结果转换为可读格式
            Map<String, Object> cityAgeStats = new HashMap<>();
            aggregatedDF.toJavaRDD().collect().forEach(row -> {
                String city = row.getString(0);
                double avgAge = row.getDouble(1);
                cityAgeStats.put(city, avgAge);
            });
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", cityAgeStats);
            response.put("totalCities", cityAgeStats.size());
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "无法读取或处理数据: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
} 