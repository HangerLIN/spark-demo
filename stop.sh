#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # 无颜色

echo -e "${YELLOW}正在停止Spark SpringBoot演示应用...${NC}"

# 查找Java进程
JAVA_PID=$(ps aux | grep "spark-springboot-demo" | grep -v grep | awk '{print $2}')

if [ -z "$JAVA_PID" ]; then
  echo -e "${RED}未找到正在运行的应用程序进程${NC}"
  exit 1
fi

# 停止进程
echo -e "${GREEN}找到进程ID: $JAVA_PID，正在停止...${NC}"
kill -15 $JAVA_PID

# 检查进程是否已停止
sleep 2
if ps -p $JAVA_PID > /dev/null; then
  echo -e "${YELLOW}进程仍在运行，尝试强制终止...${NC}"
  kill -9 $JAVA_PID
  echo -e "${GREEN}应用程序已强制终止${NC}"
else
  echo -e "${GREEN}应用程序已成功停止${NC}"
fi 