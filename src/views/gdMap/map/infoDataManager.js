/**
 * 监测点数据管理器
 * 支持动态更新监测点数据，模拟实时监测
 */

class InfoDataManager {
    constructor() {
        this.listeners = []
        this.updateInterval = null
        this.isRunning = false
    }

    /**
     * 获取当前监测点数据
     * 这里可以：
     * 1. 从API获取实时数据
     * 2. 模拟数据变化
     * 3. 从WebSocket接收数据
     */
    async fetchData() {
        try {
            const response = await fetch('http://localhost:5000/api/v1/stats/warning?limit=50&hours=1')

            // 只调用一次json()，并保存结果
            const result = await response.json()
            console.log('📡 API返回的完整数据:', result)

            // 根据您的API格式，数据在 result.data.list 中
            if (result.code === 200 && result.data && result.data.list) {
                console.log('📊 监测点列表:', result.data.list)

                // 转换数据格式，添加level字段
                return result.data.list.map(item => ({
                    name: item.name,
                    lng: item.lng,
                    lat: item.lat,
                    value: item.value,
                    level: this.getLevel(item.value),  // 根据value计算等级
                    timestamp: item.timestamp,
                    detail: item.detail,
                    record_id: item.record_id
                }))
            } else {
                console.warn('⚠️ API返回格式不正确:', result)
                return []
            }
        } catch (error) {
            console.error('❌ 获取监测点数据失败:', error)
            return []
        }
    }

    /**
     * 根据数值计算等级
     */
    getLevel(value) {
        if (value < 5) return "轻"
        if (value < 10) return "中"
        if (value < 20) return "严重"
        return "极差"
    }

    /**
     * 启动定时更新
     * @param {number} interval - 更新间隔（毫秒）
     */
    startAutoUpdate(interval = 5000) {
        if (this.isRunning) {
            console.warn('数据更新已在运行中')
            return
        }

        this.isRunning = true
        console.log(`开始自动更新监测点数据，间隔: ${interval}ms`)

        // 立即执行一次
        this.update()

        // 定时更新
        this.updateInterval = setInterval(() => {
            this.update()
        }, interval)
    }

    /**
     * 停止定时更新
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = null
            this.isRunning = false
            console.log('已停止自动更新监测点数据')
        }
    }

    /**
     * 执行一次数据更新
     */
    async update() {
        try {
            const newData = await this.fetchData()
            this.notifyListeners(newData)
            console.log('监测点数据已更新:', newData)
        } catch (error) {
            console.error('更新监测点数据失败:', error)
        }
    }

    /**
     * 订阅数据更新
     * @param {Function} callback - 数据更新时的回调函数
     */
    subscribe(callback) {
        this.listeners.push(callback)
        return () => {
            // 返回取消订阅的函数
            this.listeners = this.listeners.filter(cb => cb !== callback)
        }
    }

    /**
     * 通知所有订阅者
     */
    notifyListeners(data) {
        this.listeners.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                console.error('监听器执行失败:', error)
            }
        })
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.stopAutoUpdate()
        this.listeners = []
    }
}

// 导出单例
export const infoDataManager = new InfoDataManager()

// 同时导出类，方便测试或创建多个实例
export default InfoDataManager
