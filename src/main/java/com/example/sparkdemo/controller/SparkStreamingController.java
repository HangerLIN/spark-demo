package com.example.sparkdemo.controller;

import com.example.sparkdemo.service.SparkStreamingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/advanced")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SparkStreamingController {
    private static final Logger logger = LoggerFactory.getLogger(SparkStreamingController.class);

    @Autowired
    private SparkStreamingService streamingService;

    @PostMapping("/start-streaming")
    public ResponseEntity<?> startStreaming(
            @RequestParam(defaultValue = "60") int timeWindow,
            @RequestParam(defaultValue = "1000") double threshold) {
        try {
            logger.info("收到流处理启动请求，时间窗口：{}秒，阈值：{}", timeWindow, threshold);
            streamingService.startStreaming(timeWindow, threshold);
            return ResponseEntity.ok().body(Map.of(
                "message", "流处理已启动",
                "status", "success",
                "timeWindow", timeWindow,
                "threshold", threshold
            ));
        } catch (Exception e) {
            logger.error("启动流处理失败", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "status", "error"
            ));
        }
    }

    @PostMapping("/stop-streaming")
    public ResponseEntity<?> stopStreaming() {
        try {
            logger.info("收到流处理停止请求");
            streamingService.stopStreaming();
            return ResponseEntity.ok().body(Map.of(
                "message", "流处理已停止",
                "status", "success"
            ));
        } catch (Exception e) {
            logger.error("停止流处理失败", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "status", "error"
            ));
        }
    }

    @GetMapping("/streaming-stats")
    public ResponseEntity<?> getStreamingStats() {
        try {
            logger.debug("收到流处理统计数据请求");
            Map<String, Object> stats = streamingService.getStreamingStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("获取流处理统计数据失败", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "status", "error"
            ));
        }
    }
} 