package com.example.sparkdemo.controller;

import com.example.sparkdemo.service.SparkService;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/spark")
public class SparkController {

    @Autowired
    private SparkService sparkService;

    @GetMapping("/test-csv")
    public ResponseEntity<String> testCsv() {
        try {
            Dataset<Row> df = sparkService.readCsvFile();
            return ResponseEntity.ok("CSV文件读取成功！\n" + df.schema().prettyJson());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("CSV文件读取失败: " + e.getMessage());
        }
    }

    @PostMapping("/analyze-csv")
    public ResponseEntity<?> analyzeCsv(@RequestBody Map<String, String> request) {
        try {
            String operation = request.get("operation");
            if (operation == null) {
                return ResponseEntity.badRequest().body("操作类型不能为空");
            }

            Dataset<Row> df = sparkService.readCsvFile();
            
            switch (operation.toLowerCase()) {
                case "count":
                    long count = df.count();
                    Map<String, Long> result = new HashMap<>();
                    result.put("count", count);
                    return ResponseEntity.ok(result);
                case "statistics":
                    Dataset<Row> stats = df.describe();
                    return ResponseEntity.ok(stats.toJSON().collectAsList());
                default:
                    return ResponseEntity.badRequest().body("不支持的操作类型: " + operation);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("分析失败: " + e.getMessage());
        }
    }
} 