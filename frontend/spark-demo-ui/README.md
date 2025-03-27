# Spark大数据分析前端应用

这是一个基于React的前端应用，用于展示和调用Spark大数据分析接口。

## 功能特性

应用包含三个主要功能：

1. **词频统计**：通过提交文本到Spark后端进行词频分析
2. **CSV数据分析**：展示CSV数据的分析结果
3. **城市年龄统计**：以图表形式展示城市年龄分布情况

## 启动应用

确保后端Spark应用已在8088端口启动，然后：

```bash
cd frontend/spark-demo-ui
npm install
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

## 技术栈

- React 18
- Ant Design 5 - UI组件库 
- Ant Design Charts - 图表库
- Axios - API请求

## API说明

应用调用以下后端API：

- `/api/spark/wordcount` (POST) - 词频统计
- `/api/spark/analyze-csv` (GET) - CSV数据分析
- `/api/spark/city-age-stats` (GET) - 城市年龄统计

## 注意事项

- 由于使用了proxy配置，前端开发服务器会将API请求代理到后端服务器，避免CORS问题
- 确保后端服务在8088端口运行 