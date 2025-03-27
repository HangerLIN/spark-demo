#!/bin/bash

echo "开始测试图计算分析接口..."

# 测试用户关系网络分析
echo -e "\n测试用户关系网络分析接口..."
curl -X GET "http://localhost:8088/api/advanced/user-network" \
  -H "Content-Type: application/json" \
  | python -m json.tool

# 测试商品关联推荐
echo -e "\n测试商品关联推荐接口..."
curl -X GET "http://localhost:8088/api/advanced/product-recommendations" \
  -H "Content-Type: application/json" \
  | python -m json.tool

# 测试社区发现
echo -e "\n测试社区发现接口..."
curl -X GET "http://localhost:8088/api/advanced/communities" \
  -H "Content-Type: application/json" \
  | python -m json.tool

echo -e "\n测试完成！" 