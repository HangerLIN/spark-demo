package com.example.sparkdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.example.sparkdemo"})
public class SparkDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(SparkDemoApplication.class, args);
    }
} 