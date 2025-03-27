#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # 无颜色

# 定义API地址
API_URL="http://localhost:8088/api/advanced/kmeans"

echo -e "${YELLOW}正在测试K-means聚类接口（简化版）...${NC}"

# 简化的测试数据 - 只有三个点
TEST_DATA='[
  {"feature1": 1.0, "feature2": 1.0},
  {"feature1": 5.0, "feature2": 5.0},
  {"feature1": 9.0, "feature2": 9.0}
]'

# 发送请求并接收响应
echo -e "${GREEN}发送请求至 $API_URL${NC}"
echo "请求数据: $TEST_DATA"
echo -e "${YELLOW}正在等待响应...${NC}"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  $API_URL)

# 检查响应
if [ $? -eq 0 ]; then
  echo -e "${GREEN}请求成功！${NC}"
  echo -e "${YELLOW}响应数据:${NC}"
  echo $RESPONSE | python -m json.tool
else
  echo -e "${RED}请求失败${NC}"
fi 