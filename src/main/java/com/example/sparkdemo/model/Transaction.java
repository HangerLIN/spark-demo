package com.example.sparkdemo.model;

import java.io.Serializable;
import java.time.LocalDateTime;

public class Transaction implements Serializable {
    private String userId;
    private String productId;
    private double amount;
    private LocalDateTime timestamp;

    public Transaction() {}

    public Transaction(String userId, String productId, double amount, LocalDateTime timestamp) {
        this.userId = userId;
        this.productId = productId;
        this.amount = amount;
        this.timestamp = timestamp;
    }

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "userId='" + userId + '\'' +
                ", productId='" + productId + '\'' +
                ", amount=" + amount +
                ", timestamp=" + timestamp +
                '}';
    }
} 