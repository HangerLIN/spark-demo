#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}正在启动Spark SpringBoot演示应用...${NC}"

# 检查Java是否安装
if ! command -v java &> /dev/null; then
    echo -e "${RED}错误: 未找到Java，请安装Java 11或更高版本${NC}"
    exit 1
fi

# 使用Maven包装器启动应用
echo -e "${YELLOW}使用Spring Boot Maven插件启动应用...${NC}"
nohup ./mvnw spring-boot:run > app.log 2>&1 &

# 等待应用程序启动
echo -e "${YELLOW}等待应用程序启动...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8088/actuator/health > /dev/null; then
        echo -e "${GREEN}应用程序已成功启动！${NC}"
        exit 0
    fi
    sleep 1
done

echo -e "${RED}应用程序启动超时，请检查日志文件 app.log${NC}"
exit 1 