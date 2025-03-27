#!/bin/bash

echo "正在测试用户行为聚类接口（大数据集）..."
echo "发送请求至 http://localhost:8088/api/advanced/user-clustering"

echo "数据集：模拟50个不同用户的消费行为"

curl -X POST http://localhost:8088/api/advanced/user-clustering \
  -H "Content-Type: application/json" \
  -d '[
    {"monthlySpending": 800.0, "purchaseFrequency": 3.0},
    {"monthlySpending": 750.0, "purchaseFrequency": 2.5},
    {"monthlySpending": 680.0, "purchaseFrequency": 2.0},
    {"monthlySpending": 820.0, "purchaseFrequency": 3.2},
    {"monthlySpending": 900.0, "purchaseFrequency": 3.5},
    {"monthlySpending": 950.0, "purchaseFrequency": 3.8},
    {"monthlySpending": 780.0, "purchaseFrequency": 2.8},
    {"monthlySpending": 850.0, "purchaseFrequency": 3.3},
    {"monthlySpending": 720.0, "purchaseFrequency": 2.7},
    {"monthlySpending": 650.0, "purchaseFrequency": 2.2},
    {"monthlySpending": 880.0, "purchaseFrequency": 3.4},
    {"monthlySpending": 920.0, "purchaseFrequency": 3.6},
    
    {"monthlySpending": 1200.0, "purchaseFrequency": 4.0},
    {"monthlySpending": 1350.0, "purchaseFrequency": 4.5},
    {"monthlySpending": 1450.0, "purchaseFrequency": 5.2},
    {"monthlySpending": 1500.0, "purchaseFrequency": 5.5},
    {"monthlySpending": 1380.0, "purchaseFrequency": 4.8},
    {"monthlySpending": 1420.0, "purchaseFrequency": 5.0},
    {"monthlySpending": 1250.0, "purchaseFrequency": 4.2},
    {"monthlySpending": 1150.0, "purchaseFrequency": 3.9},
    {"monthlySpending": 1550.0, "purchaseFrequency": 5.8},
    {"monthlySpending": 1280.0, "purchaseFrequency": 4.3},
    {"monthlySpending": 1320.0, "purchaseFrequency": 4.7},
    {"monthlySpending": 1180.0, "purchaseFrequency": 4.1},
    
    {"monthlySpending": 2500.0, "purchaseFrequency": 8.0},
    {"monthlySpending": 2700.0, "purchaseFrequency": 9.0},
    {"monthlySpending": 2900.0, "purchaseFrequency": 9.5},
    {"monthlySpending": 2600.0, "purchaseFrequency": 8.3},
    {"monthlySpending": 2800.0, "purchaseFrequency": 9.2},
    {"monthlySpending": 3000.0, "purchaseFrequency": 10.0},
    {"monthlySpending": 3100.0, "purchaseFrequency": 10.5},
    {"monthlySpending": 3200.0, "purchaseFrequency": 11.0},
    {"monthlySpending": 3300.0, "purchaseFrequency": 11.5},
    {"monthlySpending": 3400.0, "purchaseFrequency": 12.0},
    {"monthlySpending": 2550.0, "purchaseFrequency": 8.1},
    {"monthlySpending": 2650.0, "purchaseFrequency": 8.5},
    {"monthlySpending": 2750.0, "purchaseFrequency": 9.1},
    {"monthlySpending": 2850.0, "purchaseFrequency": 9.3},
    
    {"monthlySpending": 5500.0, "purchaseFrequency": 6.0},
    {"monthlySpending": 5800.0, "purchaseFrequency": 6.5},
    {"monthlySpending": 6000.0, "purchaseFrequency": 15.0},
    {"monthlySpending": 6200.0, "purchaseFrequency": 14.5},
    {"monthlySpending": 5900.0, "purchaseFrequency": 6.3},
    {"monthlySpending": 6100.0, "purchaseFrequency": 14.0},
    {"monthlySpending": 5700.0, "purchaseFrequency": 7.0},
    {"monthlySpending": 6300.0, "purchaseFrequency": 13.5},
    {"monthlySpending": 5600.0, "purchaseFrequency": 6.2},
    {"monthlySpending": 5400.0, "purchaseFrequency": 5.8},
    {"monthlySpending": 6400.0, "purchaseFrequency": 12.8},
    {"monthlySpending": 6500.0, "purchaseFrequency": 13.0},
    {"monthlySpending": 5300.0, "purchaseFrequency": 5.5},
    {"monthlySpending": 6600.0, "purchaseFrequency": 12.5}
  ]' | python -m json.tool 