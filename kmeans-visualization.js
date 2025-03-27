// K-means算法可视化实现
document.addEventListener('DOMContentLoaded', function() {
    // 获取Canvas元素
    const canvas = document.getElementById('animation-canvas');
    const ctx = canvas.getContext('2d');
    const resultCanvas = document.getElementById('result-canvas');
    const resultCtx = resultCanvas.getContext('2d');
    
    // 获取控制元素
    const kValueSlider = document.getElementById('k-value');
    const speedControl = document.getElementById('speed-control');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const randomBtn = document.getElementById('random-btn');
    const iterationInfo = document.getElementById('iteration-info');
    
    // 定义颜色
    const colors = [
        '#3498db', // 蓝色
        '#e74c3c', // 红色
        '#2ecc71', // 绿色
        '#f39c12', // 橙色
        '#9b59b6', // 紫色
        '#1abc9c'  // 青色
    ];
    
    // 数据点和聚类中心
    let points = [];
    let centers = [];
    let assignments = [];
    let isRunning = false;
    let currentIteration = 0;
    
    // K-means算法状态
    let kValue = parseInt(kValueSlider.value);
    let animationSpeed = parseInt(speedControl.value);
    
    // 初始化
    function init() {
        // 清空Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // 重置数据
        points = [];
        centers = [];
        assignments = [];
        isRunning = false;
        currentIteration = 0;
        
        // 更新界面
        iterationInfo.textContent = '等待开始聚类...';
        drawPoints();
        
        // 启用按钮
        startBtn.disabled = false;
        randomBtn.disabled = false;
    }
    
    // 绘制数据点
    function drawPoints() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格背景
        drawGrid();
        
        // 绘制数据点
        points.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            
            if (assignments[index] !== undefined) {
                ctx.fillStyle = colors[assignments[index]];
            } else {
                ctx.fillStyle = '#777';
            }
            
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        
        // 绘制聚类中心
        centers.forEach((center, index) => {
            ctx.beginPath();
            ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = colors[index];
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制中心点标签
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(index + 1, center.x, center.y);
        });
    }
    
    // 绘制网格背景
    function drawGrid() {
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        
        // 绘制水平线
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // 绘制垂直线
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    }
    
    // 随机生成初始中心点
    function initializeCenters() {
        centers = [];
        kValue = parseInt(kValueSlider.value);
        
        // 随机选择K个数据点作为初始中心
        if (points.length >= kValue) {
            // 复制点并打乱顺序
            const shuffledPoints = [...points].sort(() => Math.random() - 0.5);
            
            // 选择前K个作为中心点
            for (let i = 0; i < kValue; i++) {
                centers.push({...shuffledPoints[i]});
            }
        } else {
            // 如果数据点不足，随机生成中心点
            for (let i = 0; i < kValue; i++) {
                centers.push({
                    x: Math.random() * (canvas.width - 40) + 20,
                    y: Math.random() * (canvas.height - 40) + 20
                });
            }
        }
    }
    
    // 分配数据点到最近的中心点
    function assignPointsToClusters() {
        assignments = [];
        
        points.forEach((point, pointIndex) => {
            let minDistance = Infinity;
            let nearestCenterIndex = 0;
            
            // 寻找最近的中心点
            centers.forEach((center, centerIndex) => {
                const distance = calculateDistance(point, center);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestCenterIndex = centerIndex;
                }
            });
            
            assignments[pointIndex] = nearestCenterIndex;
        });
    }
    
    // 更新中心点位置
    function updateCenters() {
        const newCenters = Array(kValue).fill().map(() => ({sumX: 0, sumY: 0, count: 0}));
        
        // 计算每个簇的点的总和
        points.forEach((point, index) => {
            const clusterIndex = assignments[index];
            newCenters[clusterIndex].sumX += point.x;
            newCenters[clusterIndex].sumY += point.y;
            newCenters[clusterIndex].count++;
        });
        
        // 计算新的中心点
        let centersMoved = false;
        centers.forEach((center, index) => {
            if (newCenters[index].count > 0) {
                const newX = newCenters[index].sumX / newCenters[index].count;
                const newY = newCenters[index].sumY / newCenters[index].count;
                
                // 检查中心点是否移动
                if (Math.abs(center.x - newX) > 0.1 || Math.abs(center.y - newY) > 0.1) {
                    centersMoved = true;
                }
                
                center.x = newX;
                center.y = newY;
            }
        });
        
        return centersMoved;
    }
    
    // 计算两点之间的欧几里得距离
    function calculateDistance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }
    
    // K-means迭代过程
    async function runKMeansIteration() {
        if (!isRunning) return;
        
        // 更新迭代信息
        currentIteration++;
        iterationInfo.textContent = `正在进行第${currentIteration}轮迭代...`;
        
        // 分配点到簇
        assignPointsToClusters();
        drawPoints();
        
        // 等待一段时间以便观察
        await new Promise(resolve => setTimeout(resolve, (6 - animationSpeed) * 300));
        
        if (!isRunning) return;
        
        // 更新中心点
        const centersMoved = updateCenters();
        drawPoints();
        
        // 等待一段时间以便观察
        await new Promise(resolve => setTimeout(resolve, (6 - animationSpeed) * 300));
        
        // 如果中心点仍在移动且未达到最大迭代次数，继续迭代
        if (centersMoved && currentIteration < 20 && isRunning) {
            runKMeansIteration();
        } else {
            // 聚类完成
            isRunning = false;
            iterationInfo.textContent = `聚类完成！共进行了${currentIteration}轮迭代。`;
            startBtn.disabled = false;
            
            // 更新结果可视化
            updateResultVisualization();
        }
    }
    
    // 开始K-means聚类
    async function startKMeans() {
        if (points.length < kValue) {
            alert(`请至少添加${kValue}个数据点。`);
            return;
        }
        
        isRunning = true;
        currentIteration = 0;
        startBtn.disabled = true;
        randomBtn.disabled = true;
        
        // 初始化中心点
        initializeCenters();
        drawPoints();
        
        // 等待一段时间以观察初始中心点
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isRunning) {
            // 开始迭代
            runKMeansIteration();
        }
    }
    
    // 重置
    function reset() {
        isRunning = false;
        init();
    }
    
    // 生成随机数据点
    function generateRandomPoints() {
        reset();
        const numPoints = 30 + Math.floor(Math.random() * 20); // 30-50个点
        
        for (let i = 0; i < numPoints; i++) {
            // 生成群集数据
            const cluster = Math.floor(Math.random() * 4);
            let x, y;
            
            switch (cluster) {
                case 0: // 左上群
                    x = Math.random() * 150 + 50;
                    y = Math.random() * 150 + 50;
                    break;
                case 1: // 右上群
                    x = Math.random() * 150 + (canvas.width - 200);
                    y = Math.random() * 150 + 50;
                    break;
                case 2: // 左下群
                    x = Math.random() * 150 + 50;
                    y = Math.random() * 150 + (canvas.height - 200);
                    break;
                case 3: // 右下群
                    x = Math.random() * 150 + (canvas.width - 200);
                    y = Math.random() * 150 + (canvas.height - 200);
                    break;
            }
            
            points.push({x, y});
        }
        
        drawPoints();
    }
    
    // 更新结果可视化 - 在结果画布上绘制
    function updateResultVisualization() {
        resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // 绘制坐标轴
        resultCtx.strokeStyle = '#333';
        resultCtx.lineWidth = 2;
        resultCtx.beginPath();
        
        // X轴 - 代表消费金额
        resultCtx.moveTo(40, resultCanvas.height - 30);
        resultCtx.lineTo(resultCanvas.width - 20, resultCanvas.height - 30);
        
        // Y轴 - 代表购买频率
        resultCtx.moveTo(40, resultCanvas.height - 30);
        resultCtx.lineTo(40, 20);
        resultCtx.stroke();
        
        // 绘制轴标签
        resultCtx.font = '12px Arial';
        resultCtx.fillStyle = '#333';
        resultCtx.textAlign = 'center';
        resultCtx.fillText('消费金额', resultCanvas.width / 2, resultCanvas.height - 10);
        
        resultCtx.save();
        resultCtx.translate(15, resultCanvas.height / 2);
        resultCtx.rotate(-Math.PI / 2);
        resultCtx.textAlign = 'center';
        resultCtx.fillText('购买频率', 0, 0);
        resultCtx.restore();
        
        // 计算数据范围以便缩放
        const maxX = Math.max(...points.map(p => p.x));
        const maxY = Math.max(...points.map(p => p.y));
        
        // 绘制散点图
        points.forEach((point, index) => {
            // 缩放坐标
            const scaledX = 40 + (point.x / maxX) * (resultCanvas.width - 60);
            const scaledY = (resultCanvas.height - 30) - (point.y / maxY) * (resultCanvas.height - 50);
            
            resultCtx.beginPath();
            resultCtx.arc(scaledX, scaledY, 5, 0, Math.PI * 2);
            resultCtx.fillStyle = colors[assignments[index]];
            resultCtx.fill();
        });
        
        // 绘制聚类中心
        centers.forEach((center, index) => {
            const scaledX = 40 + (center.x / maxX) * (resultCanvas.width - 60);
            const scaledY = (resultCanvas.height - 30) - (center.y / maxY) * (resultCanvas.height - 50);
            
            resultCtx.beginPath();
            resultCtx.arc(scaledX, scaledY, 8, 0, Math.PI * 2);
            resultCtx.fillStyle = colors[index];
            resultCtx.fill();
            resultCtx.strokeStyle = '#000';
            resultCtx.lineWidth = 2;
            resultCtx.stroke();
            
            resultCtx.font = 'bold 10px Arial';
            resultCtx.fillStyle = '#fff';
            resultCtx.textAlign = 'center';
            resultCtx.textBaseline = 'middle';
            resultCtx.fillText(index + 1, scaledX, scaledY);
        });
    }
    
    // 添加事件监听器
    canvas.addEventListener('click', function(event) {
        if (isRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        points.push({x, y});
        drawPoints();
    });
    
    startBtn.addEventListener('click', startKMeans);
    resetBtn.addEventListener('click', reset);
    randomBtn.addEventListener('click', generateRandomPoints);
    
    kValueSlider.addEventListener('input', function() {
        kValue = parseInt(this.value);
    });
    
    speedControl.addEventListener('input', function() {
        animationSpeed = parseInt(this.value);
    });
    
    // 初始化
    init();
    
    // 绘制默认的用户行为聚类结果
    drawUserBehaviorClustering();
    
    // 绘制用户行为聚类结果
    function drawUserBehaviorClustering() {
        const userCanvas = document.getElementById('result-canvas');
        if (!userCanvas) return;
        
        const userCtx = userCanvas.getContext('2d');
        
        // 清空画布
        userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);
        
        // 绘制坐标轴
        userCtx.strokeStyle = '#333';
        userCtx.lineWidth = 2;
        userCtx.beginPath();
        
        // X轴 - 代表消费金额
        userCtx.moveTo(40, userCanvas.height - 30);
        userCtx.lineTo(userCanvas.width - 20, userCanvas.height - 30);
        
        // Y轴 - 代表购买频率
        userCtx.moveTo(40, userCanvas.height - 30);
        userCtx.lineTo(40, 20);
        userCtx.stroke();
        
        // 绘制轴标签
        userCtx.font = '12px Arial';
        userCtx.fillStyle = '#333';
        userCtx.textAlign = 'center';
        userCtx.fillText('月均消费金额 (元)', userCanvas.width / 2, userCanvas.height - 10);
        
        userCtx.save();
        userCtx.translate(15, userCanvas.height / 2);
        userCtx.rotate(-Math.PI / 2);
        userCtx.textAlign = 'center';
        userCtx.fillText('月均购买频率 (次)', 0, 0);
        userCtx.restore();
        
        // 用户行为数据
        const userData = [
            // 群体0：中低消费用户
            {spending: 800, frequency: 3.0, cluster: 0},
            {spending: 750, frequency: 2.5, cluster: 0},
            {spending: 900, frequency: 3.5, cluster: 0},
            {spending: 1200, frequency: 4.0, cluster: 0},
            {spending: 1350, frequency: 4.5, cluster: 0},
            {spending: 1100, frequency: 3.9, cluster: 0},
            
            // 群体1：高消费高频用户
            {spending: 6000, frequency: 15.0, cluster: 1},
            {spending: 6200, frequency: 14.5, cluster: 1},
            {spending: 6100, frequency: 14.0, cluster: 1},
            {spending: 6300, frequency: 13.5, cluster: 1},
            
            // 群体2：中高消费中频用户
            {spending: 2500, frequency: 8.0, cluster: 2},
            {spending: 2700, frequency: 9.0, cluster: 2},
            {spending: 2900, frequency: 9.5, cluster: 2},
            {spending: 3000, frequency: 10.0, cluster: 2},
            {spending: 3300, frequency: 11.5, cluster: 2},
            
            // 群体3：高消费中频用户
            {spending: 5500, frequency: 6.0, cluster: 3},
            {spending: 5800, frequency: 6.5, cluster: 3},
            {spending: 5600, frequency: 6.2, cluster: 3},
            {spending: 5400, frequency: 5.8, cluster: 3}
        ];
        
        // 聚类中心
        const userCenters = [
            {spending: 1072, frequency: 3.8},  // 群体0
            {spending: 6300, frequency: 13.6}, // 群体1
            {spending: 2879, frequency: 9.6},  // 群体2
            {spending: 5600, frequency: 6.2}   // 群体3
        ];
        
        // 计算数据范围
        const maxSpending = 7000;
        const maxFrequency = 16;
        
        // 绘制散点图
        userData.forEach(user => {
            // 缩放坐标
            const scaledX = 40 + (user.spending / maxSpending) * (userCanvas.width - 60);
            const scaledY = (userCanvas.height - 30) - (user.frequency / maxFrequency) * (userCanvas.height - 50);
            
            userCtx.beginPath();
            userCtx.arc(scaledX, scaledY, 5, 0, Math.PI * 2);
            userCtx.fillStyle = colors[user.cluster];
            userCtx.fill();
        });
        
        // 绘制聚类中心
        userCenters.forEach((center, index) => {
            const scaledX = 40 + (center.spending / maxSpending) * (userCanvas.width - 60);
            const scaledY = (userCanvas.height - 30) - (center.frequency / maxFrequency) * (userCanvas.height - 50);
            
            userCtx.beginPath();
            userCtx.arc(scaledX, scaledY, 8, 0, Math.PI * 2);
            userCtx.fillStyle = colors[index];
            userCtx.fill();
            userCtx.strokeStyle = '#000';
            userCtx.lineWidth = 2;
            userCtx.stroke();
            
            userCtx.font = 'bold 10px Arial';
            userCtx.fillStyle = '#fff';
            userCtx.textAlign = 'center';
            userCtx.textBaseline = 'middle';
            userCtx.fillText(index + 1, scaledX, scaledY);
        });
    }
}); 